import { HERMITE_V, VEC, ramp, clamp } from "@thi.ng/ramp";
import type { Preset } from "../../types/index.js";
import { Accumulator } from "../stores/timers.js";

export class Interpolation {
  presets: { a: Preset; b: Preset };
  run: boolean;

  a: Preset;
  b: Preset;

  private t: number;
  private _inter: ReturnType<typeof ramp> | null = null;

  constructor(presets?: { a: Preset; b: Preset }, run: boolean = false) {
    this.presets = presets || { a: {} as Preset, b: {} as Preset };
    this.run = run
    this.a = this.presets.a;
    this.b = this.presets.b;
    this.t = 0;
    this._inter = null;
  }

inter( a:Preset, b:Preset ) { return ramp(
    HERMITE_V(VEC(a.getParameterValues().length)),
    [
      [0.0, a.getParameterValues()],
      [1000.0, b.getParameterValues()],
    ],
    { domain: clamp }
  );
}
  update(t:number) {
    this.t = t
  }

  reset( to: number = 0) {
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
        if ( !this._inter ) this._inter = this.inter(this.a, this.b);
      return  this._inter.at(this.t);
    }
  }
}