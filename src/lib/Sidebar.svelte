<script lang="ts">
  import { Controls, guiControls } from "../controls";
  import ParameterLock from "./ParameterLock.svelte";

  const params = {
    decay: { min: 0.0, max: 1.0, value: 0.5, step: 0.001 },
    mix: { min: 0.0, max: 1.0, value: 1.0, step: 0.001 },
    mod: { min: 0.0, max: 1.0, value: 0.5, step: 0.001 },
    size: { min: 0.0, max: 1.0, value: 0.5, step: 0.001 },
  };

  const controlPanel = guiControls(params);

  console.log(controlPanel);
</script>

<Controls controls={controlPanel} />
<ParameterLock />
