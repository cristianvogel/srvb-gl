import type { Vec } from "@thi.ng/vectors";
import type {
  UI_ControlsMap,
  UI_Preset,
} from "../../types";
import { CurrentPickedId } from "../stores/stores";
import { get } from "svelte/store";

export function extractValuesFrom(view: UI_ControlsMap): Vec {
  return Array.from(view.values()).map((slider) => slider.value) as Vec;
}

export function wrapAsPreset(settings: UI_ControlsMap): UI_Preset {
  const preset: UI_Preset = {
    index: get(CurrentPickedId),
    parameters: settings,
    getParameterValues: function () {
      return extractValuesFrom(this.parameters);
    },
    setParameterValues: function (params: Vec) {
      settings.forEach((slider, key) => {
        slider.value = params[slider.index];
      });
    },
  };
  return preset;
}
