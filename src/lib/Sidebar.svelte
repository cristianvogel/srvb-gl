<script lang="ts">
  import { Controls, guiControls } from "../controls";
  import ParameterLock from "./ParameterLock.svelte";
  import { ParamDefsHost } from "../stores/stores";
  import type { UIParameterDefinition } from "../../types";

  const paramsForUI: { [key: string]: UIParameterDefinition } =
    $ParamDefsHost.reduce(
      (
        acc: { [key: string]: UIParameterDefinition },
        { paramId, min, max, defaultValue }
      ) => {
        acc[paramId] = { min, max, value: defaultValue, step: 0.001 };
        return acc;
      },
      {}
    );

  const controlPanel = guiControls(paramsForUI);
</script>

<Controls controls={controlPanel} />
<ParameterLock />
