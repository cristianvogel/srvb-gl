
import { el } from '@elemaudio/core';
import invariant from 'invariant';

function hilbert(part, input) {

  function allpassIIR(coefficient, input) {
    return el.biquad(
      coefficient ** 2,
      0,
      -1,
      0,
      -1 * coefficient ** 2,
      input
    );
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

function shift(input, freqShift) {
  let phasor = el.phasor(
    el.sm(freqShift),
    0
  );
  let sine = el.sin(el.mul(2.0 * Math.PI, phasor));
  let cosine = el.cos(el.mul(2.0 * Math.PI, phasor));

  const f = el.sub(
    el.mul(hilbert("real", input), sine),
    el.mul(hilbert("imaginary", input), cosine)
  );

  return f;
}

export default function fs(props, xl, xr) {
  invariant(typeof props === 'object', 'Unexpected props object');
  const { key, size: len, sampleRate, ladder: ladderFeedback, hilbert } = props;

  const effectAmount = el.sm(hilbert)

  const attenuatedFb_L = el.mul(
    el.sm(ladderFeedback),
    el.tapIn({ name: 'fsfb-l' })
  );

  const attenuatedFb_R = el.mul(
    el.sm(ladderFeedback),
    el.tapIn({ name: 'fsfb-r' }),
    (2/3)
  );

  const tapDelay_L = el.delay({ key: key+'_l', size: sampleRate }, len, 0, attenuatedFb_L)
  const tapDelay_R = el.delay({ key: key+'_r', size: sampleRate }, len, 0, attenuatedFb_R)

  const freqShift = el.sm(el.mul(props.shift, el.const({ value: 443 })))


  const tappedMix_l = el.add(el.mul(effectAmount, tapDelay_L), xl)
  const tappedMix_r = el.add(el.mul(effectAmount, tapDelay_R), xr)

  const yl = shift(tappedMix_l, freqShift);
  const yr = shift(tappedMix_r, freqShift);

  // ladder feedback
  const tap_L = el.tapOut({ name: 'fsfb-l' }, el.dcblock(el.mul(hilbert,yl)))
  const tap_R = el.tapOut({ name: 'fsfb-r' }, el.dcblock(el.mul(hilbert,yr)))

  // Wet dry mixing
  return [
    el.add(el.select(hilbert, yl, xl), tap_L),
    el.add(el.select(hilbert, yr, xr), tap_R)
  ];
}

