import type { Vec } from "@thi.ng/vectors";
import { writable, type Writable } from "svelte/store";

export const CurrentVectorInterp: Writable<Vec> = writable([0, 0, 0]);

export class Accumulator {
  private t: number;
  private intervalId: NodeJS.Timeout | null;
  private ms: number;
  private rate: number;


  constructor( ms: number = 5, rate: number = 1) {
    this.t = 0;
    this.intervalId = null;
    this.ms = ms;
    this.rate = rate;
    this.reset();
  }

  current() {
    return this.t;
  }

  setMs(ms: number) {
    this.ms = ms;
  }

  start() {
    if (this.intervalId) {
      return;
    }

    this.intervalId = setInterval(() => {
 if(  this.t>1000  ) this.reset();
      this.t+=this.rate;
  }, this.ms);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  pause() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  reset() {
    this.stop();
    this.t = 0;
  }
}

