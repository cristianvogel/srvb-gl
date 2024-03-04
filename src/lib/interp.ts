import { HERMITE_V, VEC, ramp, clamp } from "@thi.ng/ramp";
import type { UI_Preset } from "../../types/index.js";
import { CurrentVectorInterp } from "../stores/stores";
import { get } from "svelte/store";
import type { Vec } from "@thi.ng/vectors";

export class Interpolation {
  presets: { a: UI_Preset; b: UI_Preset };
  run: boolean;

  a: UI_Preset;
  b: UI_Preset;

  private t: number;
  private _inter: ReturnType<typeof ramp> | null = null;

  constructor(presets?: { a: UI_Preset; b: UI_Preset }, run: boolean = false) {
    this.presets = presets || { a: {} as UI_Preset, b: {} as UI_Preset };
    this.run = run;
    this.a = this.presets.a;
    this.b = this.presets.b;
    this.t = 0;
    this._inter = null;
  }

  inter(a: UI_Preset, b: UI_Preset) {
    let startVec: Vec;
    if (get(CurrentVectorInterp)) {
      startVec = get(CurrentVectorInterp);
    } else {
      startVec = a.getParameterValues();
    }
    return ramp(
      HERMITE_V(VEC(a.getParameterValues().length)),
      [
        [0.0, startVec],
        [100.0, b.getParameterValues()],
      ],
      { domain: clamp }
    );
  }
  
  update(t: number) {
    this.t = t;
  }

  reset(to: number = 0) {
    this.t = to;
  }

  stopInterp() {
    this.t = 0;
  }

  canInterpolate() {
    return (
      typeof this.a.getParameterValues === "function" &&
      typeof this.b.getParameterValues === "function"
    );
  }

  output() {
    if (this.canInterpolate()) {
      if (!this._inter) this._inter = this.inter(this.a, this.b);
      return this._inter.at(this.t);
    }
  }
}
