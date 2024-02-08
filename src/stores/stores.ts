import { writable, type Writable } from "svelte/store";

//---- Cables  -------------------
export const CablesPatch: Writable<any> = writable("Loading...");

// ---- Parameters  -------------------
// not sure how to import this dynamically at build time
// and its really only referenced here just be
// sure to make it reflect public/manifest.json if that
// gets updated

export const manifest = {
  window: {
    width: 800,
    height: 444,
  },
  parameters: [
    { paramId: "size", name: "Size", min: 0.0, max: 1.0, defaultValue: 0.5 },
    { paramId: "decay", name: "Decay", min: 0.0, max: 1.0, defaultValue: 0.5 },
    { paramId: "mod", name: "Mod", min: 0.0, max: 1.0, defaultValue: 0.5 },
    { paramId: "mix", name: "Mix", min: 0.0, max: 1.0, defaultValue: 0.5 },
    {
      paramId: "circleID",
      name: "Circle ID",
      min: 0,
      max: 1,
      defaultValue: 0.5,
    },
    {
      paramId: "nodeValue",
      name: "Node Value",
      min: 0.0,
      max: 1.0,
      defaultValue: 0.5,
    },
  ],
};

export const PixelDensity: Writable<any> = writable(2);
export const Parameters: Writable<any> = writable(manifest.parameters);
export const DisplayNames: Writable<any> = writable(
  manifest.parameters.map((p: any) => p.name)
);
export const ParamIds: Writable<any> = writable(
  manifest.parameters.map((p: any) => p.paramId)
);

// ---- from host -------------------

export const HostState: Writable<any> = writable();
export const ErrorStore: Writable<any> = writable();
