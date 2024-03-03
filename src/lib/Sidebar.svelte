<script lang="ts">
  import Controls from "../controls/Controls.svelte";
  import ParameterLock from "./ParameterLock.svelte";
  import { ParamDefsHost, UI_Controls } from "../stores/stores";
  import type { GenericUIParamSettings } from "../../types";
  

  let paramsForUI: { [key: string]: GenericUIParamSettings } =
    $ParamDefsHost.reduce(
      (
        acc: { [key: string]: GenericUIParamSettings },
        { paramId, min, max, defaultValue }
      ) => {
        acc[paramId] = { min, max, value: defaultValue, step: 0.001 };
        return acc;
      },
      {}
    );

    // add extra params that are ViewState related only, not for controlling audio params the host
    paramsForUI = {
      ...paramsForUI,
      "smooth": { min: 0, max: 1, value: 0.5, step: 0.01 },
    };

 UI_Controls.set( paramsForUI ) 
</script>

<Controls {UI_Controls} />
<ParameterLock />
