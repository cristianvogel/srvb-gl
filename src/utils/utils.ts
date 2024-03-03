import type { Vec } from "@thi.ng/vectors";
import type { HostParameterMap, Preset } from "../../types";

export function extractValuesFrom(settings: HostParameterMap ): Vec {
    return Object.keys(settings).map((p) => settings[p].value)
   };


  export function wrapAsPreset(settings: HostParameterMap ): Preset {
    const preset = {
      parameters: settings,
      getParameterValues: () => {
        return  extractValuesFrom(settings) 
      },
    };
    return preset;
  }