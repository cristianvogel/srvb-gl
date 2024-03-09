import type { Vec } from "@thi.ng/vectors";
import type { UI_Slider, UI_ControlsMap } from "../../types";


// This function extracts the 'value' property from each UI_Slider 
// object in the UI_ControlsMap and returns them as an array of type Vec.
export function extractValuesFrom(view: UI_ControlsMap): Vec {
  return Array.from(view.values()).map((slider) => slider.value) as Vec;
}

// filter out params that are not registered with the host
export function onlyRegisteredParams(
  view: UI_ControlsMap
): Map<string, UI_Slider> {
  let onlyRegisteredParams = new Map(
    [...view].filter(([key, value]) => value.isRegistered)
  );
  return onlyRegisteredParams;
}


// Convert an array of UI_ControlsMap to serializable structure (array of objects)
export function serialisePresets(arrayOfPresets: Map<string, UI_Slider>[]) {
  const result = arrayOfPresets.map((presetMap) => {
    if (!presetMap) return {};
    let obj: { [key: string]: UI_Slider } = {};
    presetMap.forEach((settings, key) => {
      obj[key] = settings;
    });
    return obj;
  });
  return result;
}

// Convert an array of objects to an array of UI_ControlsMap (Map<string, UI_Slider>)
export function deserialisePresets(arrayOfObjects: { [key: string]: UI_Slider }[]) {
  const result = arrayOfObjects.map((presetObj) => {
    let presetMap = new Map<string, UI_Slider>();
    for (let key in presetObj) {
      presetMap.set(key, presetObj[key]);
    }
    return presetMap;
  });
  return result;
}

// sample and hold function
export function sampleAndHold(value: number, hold: boolean) {
  let heldValue: number = 0;

  return function() {
    if (hold) {
      heldValue = value;
    }

    return heldValue;
  };
}
