import { HERMITE_V, VEC, ramp, clamp } from "@thi.ng/ramp";
import type { UI_ControlsMap } from "../../types/index.js";
import { CurrentVectorInterp } from "../stores/stores";
import { get } from "svelte/store";
import type { Vec } from "@thi.ng/vectors";
import { extractValuesFrom } from "../utils/utils.js";

export class Interpolation {
  presets: { a: UI_ControlsMap; b: UI_ControlsMap };

  a: UI_ControlsMap;
  b: UI_ControlsMap;

  private t: number;
  private _inter: ReturnType<typeof ramp<Vec>> | null = null;

  public isRunning: boolean;

  constructor(presets?: { a: UI_ControlsMap; b: UI_ControlsMap }) {
    this.presets = presets || {
      a: {} as UI_ControlsMap,
      b: {} as UI_ControlsMap,
    };
    this.isRunning = false;
    this.a = this.presets.a;
    this.b = this.presets.b;
    this.t = 0;
    this._inter = null;
  }

  inter(a: UI_ControlsMap, b: UI_ControlsMap) {
    let startVec: Vec;

    if (get(CurrentVectorInterp)) {
      startVec = get(CurrentVectorInterp);
    } else {
      startVec = extractValuesFrom(a);
    }
    return ramp<Vec>(
      HERMITE_V(VEC(a.size)),
      [
        [0.0, startVec],
        [100.0, extractValuesFrom(b)],
      ],
      { domain: clamp }
    );
  }

  update(t: number) {
    this.t = t;
  }

  reset(to: number = 0) {
    this.t = to;
    this.isRunning = true;
  }

  stopInterp() {
    this.t = 0;
  }

  canInterpolate() {
    return this.a.size > 0 && this.b.size > 0;
  }

  output() {
    // trash interpolator if t is greater than 100
    if (this.t > 100) {
      this._inter = null;
      this.isRunning = false;
    }

    if (this.canInterpolate()) {
      if (!this._inter) this._inter = this.inter(this.a, this.b);
      return this._inter?.at(this.t);
    }

    return get(CurrentVectorInterp);
  }
}
