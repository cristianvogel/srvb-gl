import { HERMITE_V, VEC, ramp, clamp, Ramp, wrapInterval, wrap } from "@thi.ng/ramp";
import type { UI_ControlsMap } from "../../types/index.js";
import { Accumulator, CurrentVectorInterp, UI_Controls } from "../stores/stores";
import { get } from "svelte/store";
import type { Vec } from "@thi.ng/vectors";
import { extractValuesFrom } from "../utils/utils.js";

export class Interpolation {
  presets: { a: UI_ControlsMap; b: UI_ControlsMap };

  a: UI_ControlsMap;
  b: UI_ControlsMap;

  private _t: number;
  private __maxT: number = 100;
  private _inter: Ramp<Vec> | null = null;
  private _initialVectors: { a: Vec; b: Vec };
  private _isRunning: boolean;

  constructor(presets?: { a: UI_ControlsMap; b: UI_ControlsMap }) {
    this.presets = presets || {
      a: {} as UI_ControlsMap,
      b: {} as UI_ControlsMap,
    };
    this._isRunning = false;
    this.a = this.presets.a;
    this.b = this.presets.b;
    this._initialVectors = {
      a: extractValuesFrom(this.a),
      b: extractValuesFrom(this.b),
    };
    this._t = 0;
    this._inter = null;
  }

  vectorInterpolation(a: UI_ControlsMap, b: UI_ControlsMap): Ramp<Vec> {
    let startVec: Vec = this._initialVectors.a;

    if (this._isRunning) {
     this.setStopAtCurrentT( get(CurrentVectorInterp) );
    } else {
      startVec = this._initialVectors.a;
    }
    return ramp<Vec>(
      HERMITE_V(VEC(a.size)),
      [
        [0.0, startVec],                        // source stop
        [this.__maxT, this._initialVectors.b],  // target stop
      ],
      { domain: clamp }
    );
  }

  changeCourseTowards(p: UI_ControlsMap) {
    if (this._inter) {
      this.setStopAtCurrentT( get(CurrentVectorInterp) );
      this.setStopAtMaxT( extractValuesFrom(p) ); // validity check and handler?
    }
  }

  setStopAtMaxT(b: Vec) {
    if (this._inter) this._inter?.setStopAt(this.__maxT, b);
  }
  setStopAtCurrentT(a: Vec) {
    if (this._inter) this._inter?.setStopAt(this._t, a);
  }

  get maxCount() {
    return this.__maxT;
  }

  update(t: number) {
    if (this._t >= this.__maxT) {
      this._isRunning = false;
      return;
    }
    this._t = t;
  }

  reset(to: number = 0) {
    this._t = to;
    this._isRunning = true;
  }

  stopInterp() {
    this._isRunning = false;
    this._inter = null;
    Accumulator.set(-1)
  }

  isStopped() {
    return !this._isRunning;
  }
  isRunning() {
    return this._isRunning;
  }

  canInterpolate() {
    return this.a.size > 0 && this.b.size > 0;
  }

  output() {
 
    // trash interpolator if t is greater than 100
    if (this._t > 100) {
      this.stopInterp();
      return get(CurrentVectorInterp);
    }

    if (this.canInterpolate()) {
      if (!this._inter) this._inter = this.vectorInterpolation(this.a, this.b);
      return this._inter?.at(this._t);
    }

    return get(CurrentVectorInterp);
  }
}
