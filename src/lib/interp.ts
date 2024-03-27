import {
  HERMITE_V,
  VEC,
  ramp,
  clamp,
  Ramp,
  wrapInterval,
  wrap,
  linear,
} from "@thi.ng/ramp";
import type { UI_ControlsMap } from "../../types/index.js";
import { Accumulator, CurrentVectorInterp } from "../stores/stores";
import { get } from "svelte/store";
import type { Vec } from "@thi.ng/vectors";
import { extractValuesFrom } from "../utils/utils.js";

export class Interpolator {
  protected _isRunning: boolean;

  constructor() {
    this._isRunning = false;
  }

  isStopped() {
    return !this._isRunning;
  }

  isRunning() {
    return this._isRunning;
  }
}

export class VectorInterpolator extends Interpolator {
  presets: { a: UI_ControlsMap; b: UI_ControlsMap };

  a: UI_ControlsMap;
  b: UI_ControlsMap;

  private _t: number;
  private __maxT: number = 100;
  private _inter: Ramp<Vec> | null;
  private _initialVectors: { a: Vec; b: Vec };

  constructor(presets?: { a: UI_ControlsMap; b: UI_ControlsMap }) {
    super();
    this.presets = presets || {
      a: {} as UI_ControlsMap,
      b: {} as UI_ControlsMap,
    };
    this.a = this.presets.a;
    this.b = this.presets.b;
    this._initialVectors = {
      a: extractValuesFrom(this.a),
      b: extractValuesFrom(this.b),
    };
    this._t = 0;
    this._inter = null;
  }

  run() {
    this._isRunning = true;
  }

  stop() {
    this._isRunning = false;
    this.killInterp();
  }

  vectorInterpolation(a: UI_ControlsMap, b: UI_ControlsMap): Ramp<Vec> {
    let startVec: Vec = this._initialVectors.a;
    if (this.isRunning()) {
      this.setStopAtCurrentT(get(CurrentVectorInterp));
    }
    return ramp<Vec>(
      HERMITE_V(VEC(a.size)),
      [
        [0.0, startVec], // source stop
        [this.__maxT, this._initialVectors.b], // target stop
      ],
      { domain: clamp }
    );
  }
  changeCourseTowards(p: UI_ControlsMap) {
    if (this._inter) {
      this.setStopAtCurrentT(get(CurrentVectorInterp));
      this.setStopAtMaxT(extractValuesFrom(p)); // validity check and handler?
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
      this.killInterp();
      return;
    }
    this._t = t;
  }
  reset(to: number = 0) {
    this._t = to;
    this._isRunning = true;
  }

  killInterp() {
    this._isRunning = false;
    this._inter = null;
  }

  canInterpolate() {
    return this.a.size > 0 && this.b.size > 0;
  }

  get current() {
    return this._current();
  }

    // this is the interpolated output value from the ramp
  protected _current(): Vec | number {
    if (this._t >= 100) {
      this.stop();
      return -1;
    }
    if (this.canInterpolate() && !this._inter) {
      this._inter = this.vectorInterpolation(this.a, this.b);
    }
   return this._inter?.at(this._t) || -1;
  }
}

/* this is simplifed version of VectorInterpolation, 
plan to use this as the global stored accumulator */

export class TimeIndex1D extends Interpolator {
  private _t: number;
  private _maxT: number;
  private _inter: Ramp<number> | null = null;
  private _startTime!: number;
  public rate: number = 1;

  constructor() {
    super();
    this._t = 0;
    this._maxT = 100;
    this._inter = this.__getInstance();
    console.log("TimeIndex1D created");
  }

  private __getInstance() {
    if (!this._inter) {
      return linear(
        [
          [0.0, 0],
          [this._maxT, 1],
        ],
        { domain: clamp }
      );
    } else return this._inter;
  }

  start() {
    this.__getInstance();
    this.reset();
    this._isRunning = true;
  }

  stop() {
    this._isRunning = false;
    this._inter = null;
  }

  setRate(r: number) {
    this.rate = r;
  }

  changeCourseTowards(p: number) {
    if (this._inter) {
      this.setStopAtCurrentT((this._currentValue() as number) || 0);
      this.setStopAtMaxT(p);
    }
  }

  setStopAtMaxT(b: number) {
    if (this._inter) this._inter?.setStopAt(this._maxT, b);
  }

  setStopAtCurrentT(a: number) {
    if (this._inter) this._inter?.setStopAt(this._t, a);
  }

  update() { 
      if (this.isStopped()) this.start() ;
      if (this._t >= this._maxT) { this.stop(); return;}
      const r = (this.rate > 0 ? this.rate : 1.0e-4);
      this._t = ((performance.now() * r) - (this._startTime * r));
  }

  reset(to: number = 0) {
 
    this._startTime = performance.now();
    this._t = 0;
  }

  killInterp() {
    this._inter = null;
  }

  // will return 0-1 normalised value or -1 if stopped
  get current(): number {
    return this._currentValue();
  }

  protected _currentValue(): number {

    if (!this._inter) {
      this._inter = this.__getInstance();
    }

    if (this._t > this._maxT) {
      this.stop();
      return this._maxT;
    }
    // this is the interpolated output value from the ramp
    return this._inter?.at(this._t) || 1;
  }
}
