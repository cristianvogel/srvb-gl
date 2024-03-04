import type { Vec } from "@thi.ng/vectors";
import type {
  UI_ParameterController,
  UI_Preset,
} from "../../types";

export function extractValuesFrom(settings: UI_ParameterController[]): Vec {
  return Object.keys(settings).map((p: string) => settings[p].value);
}

export function wrapAsPreset(settings: UI_ParameterController[]): UI_Preset {
  const preset: UI_Preset = {
    parameters: settings,
    getParameterValues: function() {
      return extractValuesFrom(this.parameters);
    },
    setParameterValues: function(values: Vec) {
      this.parameters.forEach((controller: UI_ParameterController, i: number) => {
        Object.keys(controller).forEach((paramId: string) => {
          controller[paramId].value = values[i];
        });
      });
    },
  };
  return preset;
}
