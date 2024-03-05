import type { Vec } from "@thi.ng/vectors";
import type { UI_Slider, UI_ControlsMap } from "../../types";

export function extractValuesFrom(view: UI_ControlsMap): Vec {
  return Array.from(view.values()).map((slider) => slider.value) as Vec;
}

export function onlyRegisteredParams(
  view: UI_ControlsMap
): Map<string, UI_Slider> {
  let onlyRegisteredParams = new Map(
    [...view].filter(([key, value]) => value.isRegistered)
  );
  return onlyRegisteredParams;
}
