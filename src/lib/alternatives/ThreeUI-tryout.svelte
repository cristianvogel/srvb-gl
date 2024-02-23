<script lang="ts">
  import * as THREE from "three";
  import Stats from "three/addons/libs/stats.module.js";
  import { GUI } from "three/addons/libs/lil-gui.module.min.js";
  import { OrbitControls } from "three/addons/controls/OrbitControls.js";

  let camera: THREE.PerspectiveCamera,
    scene: THREE.Scene,
    renderer: THREE.WebGLRenderer,
    controls: OrbitControls,
    stats: Stats;

  let mesh: THREE.InstancedMesh;
  const amount = 3;
  const count = Math.pow(amount, 3);
  const scale = 1;
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2(1, 1);

  const color = new THREE.Color();
  const white = new THREE.Color().setHex(0xffffff);

  init();
  animate();

  function init() {
    camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(amount, amount, amount);
    camera.lookAt(0, 0, 0);

    scene = new THREE.Scene();

    const light = new THREE.HemisphereLight(0xffffff, 0x882288, 2);
    light.position.set(0, 1, 0);
    scene.add(light);

    const geometry = new THREE.CylinderGeometry(0.4, 0.4, 0.1);

    const material = new THREE.MeshPhongMaterial({ color: 0xeeeeee });

    mesh = new THREE.InstancedMesh(geometry, material, count);

    let i = 0;
    const offset = (amount - 1) / 2;

    const matrix = new THREE.Matrix4();

    for (let x = 0; x < amount; x++) {
      for (let y = 0; y < amount; y++) {
        for (let z = 0; z < amount; z++) {
          matrix.setPosition(offset - x, offset - y, offset - z);
          mesh.setMatrixAt(i, matrix);
          mesh.setColorAt(i, color);

          i++;
        }
      }
    }

    scene.add(mesh);

    //

    const gui = new GUI();
    gui.add(mesh, "count", 0, count);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);

    controls.enableDamping = true;
    controls.dampingFactor = 0.04;
    controls.enableZoom = true;
    controls.maxDistance = 5;
    controls.minDistance = 4;
    controls.enablePan = false;

    stats = new Stats();
    document.body.appendChild(stats.dom);

    window.addEventListener("resize", onWindowResize);
    document.addEventListener("mousemove", onMouseMove);
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function onMouseMove(event: {
    preventDefault: () => void;
    clientX: number;
    clientY: number;
  }) {
    event.preventDefault();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  function animate() {
    requestAnimationFrame(animate);

    controls.update();

    raycaster.setFromCamera(mouse, camera);

    const intersection = raycaster.intersectObject(mesh);

    if (intersection.length > 0) {
      const instanceId = intersection[0].instanceId as number;

      mesh.getColorAt(instanceId, color);

      if (color.equals(white)) {
        const position = new THREE.Vector3();
        const rotation = new THREE.Quaternion();
        const scale = new THREE.Vector3();
        const matrix = new THREE.Matrix4();
        mesh.getMatrixAt(instanceId, matrix);
        matrix.decompose(position, rotation, scale);
        scale.set(1, 2, 1);
        mesh.setMatrixAt(instanceId, matrix.compose(position, rotation, scale));
        mesh.setColorAt(instanceId, color.setHex(Math.random() * 0xffffff));
        mesh.instanceColor.needsUpdate = true;
        mesh.instanceMatrix.needsUpdate = true;
      }
    }

    render();

    stats.update();
  }

  function render() {
    renderer.render(scene, camera);
  }
</script>
