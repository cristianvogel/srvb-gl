<script lang="ts">
  import RayCastPointer from "./RayCastPointer.svelte";

  import {
    T,
    createRawEventDispatcher,
    useTask,
    useThrelte,
    watch,
  } from "@threlte/core";
  import type { CosGradientSpec } from "@thi.ng/color/api/gradients";
  import {
    cosineGradient,
    COSINE_GRADIENTS,
    css,
    rgb,
    srgb,
  } from "@thi.ng/color";
  import { Group, MOUSE, Object3D, Color as THREE_Color, Vector3 } from "three";
  import {
    Instance,
    InstancedMesh,
    OrbitControls,
    interactivity,
    RoundedBoxGeometry,
    Text,
    PortalTarget,
  } from "@threlte/extras";
  import { arrayIterator, fillRange } from "@thi.ng/arrays";
  import {
    UI_ClassFSMs,
    ShowMiniBars,
    CurrentPickedId,
    UI_Controls,
    UI_StorageFSMs,
    CurrentFocusId,
    Accumulator,
  } from "../stores/stores";
  import type { UI_ControlsMap, UI_Preset } from "../../types";
  import { get } from "svelte/store";
  import { onMount } from "svelte";
  import { degToRad } from "three/src/math/MathUtils.js";

  const gradient: CosGradientSpec = COSINE_GRADIENTS["green-blue-orange"];
  const palette = cosineGradient(32, gradient).map((c) => css(c));
  const colorRotate = 12;
  const elementsPerSide = 8;
  const radius = 0.25 || 0.1618;
  const layers = [1]; // layers of nodes
  const startingMeshPosition: Vector3 = new Vector3(-0.5, 1, -0.25);

  let positionMeshIndex = 0;

  const dispatch = createRawEventDispatcher();
  const { scene } = useThrelte();

  onMount(() => {
    console.log("Mounted scene.");
    scene.background = new THREE_Color(css(rgb("hsl(220 10% 1%)")));
  });

  // Framerate dependent counter, made independent from framerate using delta division
  useTask("deltaCount", (delta) => deltaCount(delta));

  // super cool Threlte framecount independent counting timer
  function deltaCount(delta: number) {
    let rate = Math.max(1.0e-3, $UI_Controls.get("smooth")?.value || 0);
    rate = rate ** 1.6 * 0.1;
    $Accumulator = $Accumulator + delta / rate;
  }

  // UI draw update when storage state machines update
  // goes through every mesh in the instanced mesh object
  watch(UI_StorageFSMs, (storage) => {
    let gridComponents = scene.children.filter(
      (component) => component.name === "grid"
    );
    gridComponents.forEach((gridComponent) => {
      let cubes = gridComponent.children.filter((cube) => cube.name === "cube");
      cubes.forEach((cube, i) => {
        if (get(storage[i]) === "filled") {
          $UI_ClassFSMs[i].fill(cube);
        } else {
          $UI_ClassFSMs[i].empty(cube);
        }
      });
    });
  });

  function saveMeshColorInStore(o: { ref: Group; cleanUp: Function }): void {
    if (!o.ref.isObject3D || o.ref.name !== "cube") return;
    const mesh = o.ref;
    //@ts-ignore
    const colorPick: THREE_Color = mesh.color;
    const base = new THREE_Color(colorPick);
    const highlighted = new THREE_Color("red");
    $UI_ClassFSMs[positionMeshIndex].assign({ base, highlighted });
    positionMeshIndex++;
  }

  /* Interactivity
//////////////// 
*/
  // store a preset
  function nodeRightClick(o: any) {
    $CurrentPickedId = o.instanceId;
    const nodeId: number = $CurrentPickedId;
    // 🚨📌 nasty bug solved here - the snapshot was being passed by reference!
    const controlsSnapshot: UI_ControlsMap = $UI_Controls; // deep copy
    console.log("snapshot->", controlsSnapshot);
    const preset: UI_Preset = {
      eventObject: o.eventObject,
      index: nodeId,
      name: "Node_" + nodeId,
      parameters: controlsSnapshot,
    };
    dispatch("newSnapshot", preset);
  }

  // interpolate preset
  function nodeClick(o: any) {
    $CurrentPickedId = o.instanceId;
    dispatch("interpolatePreset", true);
    console.log(o);
  }

  function nodeEnter(o: any) {
    $ShowMiniBars = true;
    $CurrentFocusId = o.instanceId;
  }

  function nodePointer(o: any) {
    $ShowMiniBars = true;
    $CurrentFocusId = o.instanceId;
  }

  function nodeLeave(o: any) {
    $ShowMiniBars = false;
  }

  interactivity();
</script>

<T.PerspectiveCamera
  makeDefault
  position={[elementsPerSide - 2, elementsPerSide+4, elementsPerSide]}
  zoom={5.5}
>
  <OrbitControls
    mouseButtons={{ LEFT: 0, RIGHT: MOUSE.ROTATE }}
    enableDamping={true}
    enableZoom={true}
    zoomToCursor={true}
    zoomSpeed={0.1}
    maxDistance={20}
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
  <RoundedBoxGeometry args={[radius, radius + 0.01, radius]} radius={0.01} />

  <T.MeshStandardMaterial />

  {#each Array.from({ length: elementsPerSide }, (_, i) => i) as x}
    {@const offsetter = arrayIterator(fillRange([], 0, -1, 1, 1 / 12))};
    {#each layers as y}
      {#each Array.from({ length: elementsPerSide }, (_, i) => i) as z}
        {@const nodeIndex = y * z + x * elementsPerSide}
        {@const colorPick = (x + y + z + colorRotate) % palette.length}
        {@const pos = {
          x: (x + Math.sin(Number(offsetter.next().value))) / 2,
          y: y,
          z: (z - 1) / 2,
        }}

        <Text
          name="label"
          scale={4 / 6}
          text={`${nodeIndex}`}
          characters="0123456789.►-ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz"
          position={[pos.x - 0.06, pos.y + 0.1, pos.z + 0.175]}
          color={palette[colorPick - 2]}
        />
        <Instance
          name="cube"
          on:create={(o) => saveMeshColorInStore(o)}
          on:click={(e) => {
            // left mouse button sends
            e.stopPropagation();
            nodeClick(e);
          }}
          on:contextmenu={(e) => {
            // right mouse button stores
            e.stopPropagation();
            nodeRightClick(e);
          }}
          on:pointerenter={nodeEnter}
          on:pointerleave={nodeLeave}
          on:pointermove={nodePointer}
          color={palette[colorPick]}
          position={[pos.x, pos.y, pos.z]}
        />
      {/each}
    {/each}
  {/each}
  <PortalTarget id="nodes" />
</InstancedMesh>

<T.DirectionalLight position={[0, 8, 0]} />
<T.AmbientLight intensity={0.7} />
