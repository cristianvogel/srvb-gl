<script lang="ts">
  import { arrayIterator, fillRange } from "@thi.ng/arrays";
  import {
    COSINE_GRADIENTS,
    color,
    cosineGradient,
    css,
    hsv,
    luminance,
    rgb,
    rgbCss,
    tint,
  } from "@thi.ng/color";
  import type { CosGradientSpec } from "@thi.ng/color/api/gradients";
  import { Vec4 } from "@thi.ng/vectors";
  import { roundTo } from "@thi.ng/math";
  import {
    T,
    createRawEventDispatcher,
    useTask,
    useThrelte,
    watch,
  } from "@threlte/core";
  import {
    InstancedMesh,
    OrbitControls,
    PortalTarget,
    RoundedBoxGeometry,
    Text,
    interactivity,
  } from "@threlte/extras";
  import { onMount } from "svelte";
  import { cubicOut } from "svelte/easing";
  import { tweened } from "svelte/motion";
  import { get } from "svelte/store";
  import { MOUSE, Color as THREE_Color, Vector3 } from "three";
  import { degToRad } from "three/src/math/MathUtils.js";
  import type { UI_ControlsMap, UI_Preset } from "../../types";
  import {
    Accumulator,
    CurrentFocusId,
    CurrentPickedId,
    ShowMiniBars,
    UI_ClassFSMs,
    UI_Controls,
    UI_StorageFSMs,
  } from "../stores/stores";
  import Cube from "./Cube.svelte";
  import RayCastPointer from "./RayCastPointer.svelte";
  import { NativeMessage } from "../stores/NativeMessage";

  const gradient: CosGradientSpec = COSINE_GRADIENTS["green-blue-orange"];
  const palette = cosineGradient(32, gradient).map((c) => css(c));
  const colorRotate = 12;
  const elementsPerSide = 8;
  const radius = 0.25 || 0.1618;
  const startingMeshPosition: Vector3 = new Vector3(-0.5, 1.75, -0.25);

  const dispatch = createRawEventDispatcher();
  const { scene } = useThrelte();

  const zoomTransition = tweened(1, { duration: 1500, easing: cubicOut });

  // Framerate dependent counter, made independent from framerate using delta division
  const { task: deltaCountTask } = useTask(
    "deltaCountTask",
    (delta) => deltaCount(delta),
    { autoStart: false }
  );
  // pulled up the delta count callback, easier to read?
  function deltaCount(delta: number) {
    // Accumulator over 100, then set to -1 means that interpolations are over,
    // so we stop the deltaCountTask
    if ($Accumulator > 100) {
      $Accumulator = -1;
      deltaCountTask.stop();
      return;
    } else {
      let rate = Math.max(1.0e-3, $UI_Controls.get("smooth")?.value || 0);
    rate = rate ** 1.6 * 0.25;
      $Accumulator = $Accumulator + delta / rate;
    }
  }

  // UI paint update when storage state machines update.
  // goes through every mesh in the instanced mesh object
  //
  // todo: optimise to use a Map accessor or a memoized deep equiv
  // seems to get called way more times than necessary
  // its a mesh, so should only get called once
  watch([UI_StorageFSMs], () => {
    let mesh = scene.children.filter((component) => component.name === "grid");
    mesh.forEach((instance) => {
      let cubes = instance.children.filter((cube) => cube.name === "cube");
      cubes.forEach((cube, i) => {
        if (get($UI_StorageFSMs[i]) === "filled") {
          $UI_ClassFSMs[i].fill(cube);
        } else {
          $UI_ClassFSMs[i].empty(cube);
        }
      });
    });
  });

  /* Interactivity
//////////////// 
*/
  interactivity();

  const userEvents = {
    // store a preset
    nodeRightClick: function (o: any) {
      $CurrentPickedId = o.instanceId;
      const nodeId: number = $CurrentPickedId;
      // 🚨📌 nasty bug solved here - the snapshot was being passed by reference!
      const controlsSnapshot: UI_ControlsMap = $UI_Controls; // deep copy
      const preset: UI_Preset = {
        eventObject: o.eventObject,
        index: nodeId,
        name: "Node_" + nodeId,
        parameters: controlsSnapshot,
      };
      dispatch("newSnapshot", preset);
    },
    // start new preset interpolation
    nodeClick: function (o: any) {
      $CurrentPickedId = o.instanceId;
      dispatch("interpolatePreset", true);
      // start the Threlte useTask delta-based frame count
      deltaCountTask.start();
      // Special case: update the picked box id in the host, needs fancy halfway rounding error custom normalising too
      const n = $CurrentPickedId;
      const rounded =
        n <= 32 ? roundTo(n / 64, 1 / 63) : roundTo((n + 1) / 64, 1 / 63);
      $NativeMessage.requestParamValueUpdate("box", rounded);
    },
    // show mini chart overlay
    nodeEnter: function (o: any) {
      $ShowMiniBars = true;
      $CurrentFocusId = o.instanceId;
    },
    nodeLeave: function (o: any) {
      $ShowMiniBars = false;
    },
  };

  //////////////////////////////

  onMount(() => {
    console.log("Scene ready.");
    scene.background = new THREE_Color(css(rgb("hsl(220 10% 1%)")));
    zoomTransition.set(3);
  });
</script>

<T.PerspectiveCamera
  makeDefault
  position={[elementsPerSide - 2, elementsPerSide + 4, elementsPerSide]}
  zoom={$zoomTransition}
>
  <OrbitControls
    mouseButtons={{ LEFT: 0, RIGHT: MOUSE.ROTATE }}
    enableDamping={true}
    enableZoom={true}
    zoomToCursor={true}
    zoomSpeed={0.2}
    maxDistance={30}
    minDistance={4}
    minAzimuthAngle={-1}
    maxAzimuthAngle={1}
    enablePan={true}
    panSpeed={0.05}
    rotateSpeed={0.05}
  />
</T.PerspectiveCamera>
<RayCastPointer />

<InstancedMesh
  position={startingMeshPosition.toArray()}
  name="grid"
  rotation={[0, degToRad(-9), 0]}
>
  <RoundedBoxGeometry args={[radius, radius + 0.01, radius]} radius={0.02} />

  <T.MeshStandardMaterial />

  {#each Array.from({ length: elementsPerSide }, (_, i) => i) as x}
    {@const offsetter = arrayIterator(fillRange([], 0, -1, 1, 1 / 12))};
    {@const y = 1}
    {#each Array.from({ length: elementsPerSide }, (_, i) => i) as z}
      {@const nodeIndex = y * z + x * elementsPerSide}
      {@const colorPick = (x + y + z + colorRotate) % palette.length}
      {@const pos = {
        x: (x + Math.sin(Number(offsetter.next().value))) / 2,
        y: y,
        z: (z - 1) / 2,
      }}
      {@const t_paint = color(palette[colorPick])}

      <Text
        name="label"
        scale={4 / 6}
        text={`${nodeIndex}`}
        characters="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
        position={[pos.x - 0.06, pos.y + 0.1, pos.z + 0.175]}
        color={palette[colorPick - 2]}
      />

      <Cube
        {nodeIndex}
        colors={{
          base: palette[colorPick],
          highlighted: rgbCss(
            tint(
              new Vec4(),
              hsv(css("#c439b8")),
              (1 - luminance(t_paint)) ** 0.125,
              0.25
            )
          ),
        }}
        position={pos}
        accumulator={$CurrentPickedId === nodeIndex &&
        get($UI_StorageFSMs[nodeIndex]) === "filled"
          ? Accumulator
          : null}
        {userEvents}
      />
    {/each}
  {/each}
  <PortalTarget id="nodes" />
</InstancedMesh>

<T.DirectionalLight position={[0, 8, 0]} />
<T.AmbientLight intensity={0.7} />
