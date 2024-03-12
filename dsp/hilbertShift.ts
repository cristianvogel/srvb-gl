import { ElemNode, el } from "@elemaudio/core";
import invariant from "invariant";

function mute(input: ElemNode): ElemNode {
  return el.mul(input, 0.0);
}

function drive(input: ElemNode, bypass: boolean = false) {
  return !bypass ? el.tanh(el.mul(1.618, input)) : input;
}

function hilbert(part: "real" | "imaginary", input: ElemNode): ElemNode {
  function allpassIIR(coefficient, input): ElemNode {
    return el.biquad(coefficient ** 2, 0, -1, 0, -1 * coefficient ** 2, input);
  }

  switch (part) {
    case "real":
      return el.z(
        allpassIIR(
          0.9987488452737,
          allpassIIR(
            0.988229522686,
            allpassIIR(0.9360654322959, allpassIIR(0.6923878, input))
          )
        )
      );
    case "imaginary":
      return allpassIIR(
        0.9952884791278,
        allpassIIR(
          0.9722909545651,
          allpassIIR(0.856171088242, allpassIIR(0.4021921162426, input))
        )
      );
  }
}

function shift(input, freqShift: ElemNode): ElemNode {
  let phasor = el.phasor(el.sm(freqShift) as any, 0);
  let sine = el.sin(el.mul(2.0 * Math.PI, phasor));
  let cosine = el.cos(el.mul(2.0 * Math.PI, phasor));

  const f = el.sub(
    el.mul(hilbert("real", input), sine),
    el.mul(hilbert("imaginary", input), cosine)
  );

  return f;
}

export default function fs(props, xl, xr): ElemNode[] {
  invariant(typeof props === "object", "Unexpected props object");
  const { key, size: len, sampleRate, hilbert } = props;

  let ladderFeedback = el.sm(props.ladder);

  const effectAmount = el.sm(hilbert);

  const butterworthQ = 1 / Math.sqrt(2);
  
  const attenuatedFb_L = el.mul(
    ladderFeedback,
    drive(el.lowpass(6000, butterworthQ, el.tapIn({ name: "fsfb-l" })))
  );

  const attenuatedFb_R = el.mul(
    ladderFeedback,
    drive(el.lowpass(6000, butterworthQ, el.tapIn({ name: "fsfb-r" })))
  );

  const tapDelay_L = el.delay(
    { key: key + "_l", size: sampleRate },
    el.sm(len),
    0,
    attenuatedFb_L
  );
  const tapDelay_R = el.delay(
    { key: key + "_r", size: sampleRate * (2 / 3) },
    el.sm(len),
    -0.1,
    attenuatedFb_R
  );

  const freqShift = el.sm(el.mul(props.shift, el.const({ value: 443 })));

  const tappedMix_l = el.add(el.mul(effectAmount, tapDelay_L), xl);
  const tappedMix_r = el.add(el.mul(effectAmount, tapDelay_R), xr);

  const compress = (i) => el.compress(10, 250, -18, 3, i, i);

  const yl = shift(tappedMix_l, freqShift);
  const yr = shift(tappedMix_r, freqShift);

  // ladder feedback
  const tap_L = mute(
    el.tapOut({ name: "fsfb-l" }, compress(el.dcblock(el.mul(hilbert, yl))))
  );
  const tap_R = mute(
    el.tapOut({ name: "fsfb-r" }, compress(el.dcblock(el.mul(hilbert, yr))))
  );

  const out_L = el.add(tap_L, yl);
  const out_R = el.add(tap_R, yr);

  // Wet dry mixing
  return [
    el.select(hilbert, out_L, xl),
    el.select(hilbert, out_R, xr),
  ];
}
