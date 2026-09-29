import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createAircraft } from './aircraft';

const ANNOTATIONS = [
  { id: 'nose', number: '01', label: '机首与驾驶舱', offset: [-55, -72] },
  { id: 'tail', number: '07', label: '垂直安定面', offset: [44, -45] },
  { id: 'engine-right', number: '06', label: 'GEnx-1B 发动机', offset: [-45, 73] },
  { id: 'wing-right', number: '04', label: '复合材料机翼', offset: [45, 50] },
];

export const Scene = forwardRef(function Scene({ state, onSelect, onReady }, ref) {
  const mountRef = useRef(null),
    apiRef = useRef(null),
    propsRef = useRef({ state, onSelect, onReady });
  const [error, setError] = useState('');
  propsRef.current = { state, onSelect, onReady };
  useImperativeHandle(
    ref,
    () => ({
      zoom: (factor) => apiRef.current?.zoom(factor),
      export: () => apiRef.current?.export(),
      getExplosion: () => apiRef.current?.getExplosion() ?? 0,
    }),
    [],
  );

  useEffect(() => {
    const mount = mountRef.current;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x111b1d, 0.011);
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 250);
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setError('3D 渲染不可用，请启用浏览器硬件加速后重试。');
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.setClearColor(0x111b1d, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.setAttribute('aria-label', '波音 787-9 三维交互模型');
    renderer.domElement.dataset.testid = 'aircraft-canvas';
    mount.prepend(renderer.domElement);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.04);
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.62;
    room.dispose();
    pmrem.dispose();

    scene.add(new THREE.HemisphereLight(0xdaeff5, 0x364b4a, 2));
    const keyLight = new THREE.DirectionalLight(0xf5fcff, 4.2);
    keyLight.position.set(-15, 28, 15);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    Object.assign(keyLight.shadow.camera, {
      left: -30,
      right: 30,
      top: 30,
      bottom: -30,
      near: 1,
      far: 100,
    });
    keyLight.shadow.bias = -0.0006;
    keyLight.shadow.normalBias = 0.045;
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x80c5d8, 2.2);
    rimLight.position.set(15, 10, -20);
    scene.add(rimLight);
    const warmLight = new THREE.DirectionalLight(0xffe7c4, 1.15);
    warmLight.position.set(-18, 2, -4);
    scene.add(warmLight);
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(180, 180),
      new THREE.ShadowMaterial({ opacity: 0.19 }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -6.5;
    shadow.receiveShadow = true;
    scene.add(shadow);

    const grid = new THREE.GridHelper(140, 70, 0x35504e, 0x243939);
    grid.position.y = -6.55;
    grid.material.transparent = true;
    grid.material.opacity = 0.37;
    scene.add(grid);
    const groundRef = new THREE.Group();
    scene.add(groundRef);
    for (const radius of [18, 18.3]) {
      const points = Array.from(
        { length: 181 },
        (_, i) =>
          new THREE.Vector3(
            Math.cos((i / 180) * Math.PI * 2) * radius,
            -6.48,
            Math.sin((i / 180) * Math.PI * 2) * radius,
          ),
      );
      groundRef.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(points),
          new THREE.LineDashedMaterial({
            color: 0x5e8780,
            dashSize: 0.45,
            gapSize: 0.35,
            opacity: 0.28,
            transparent: true,
          }),
        ).computeLineDistances(),
      );
    }
    const aircraft = createAircraft();
    scene.add(aircraft.root);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.enablePan = false;
    controls.minDistance = 24;
    controls.maxDistance = 100;
    controls.minPolarAngle = 0.04;
    controls.maxPolarAngle = Math.PI / 2 + 0.15;
    controls.autoRotateSpeed = 0.35;
    controls.target.set(0, 0.35, 0);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pose = new THREE.Vector3(-31, 21, 34);
    let cameraAnimating = false,
      frame = 0,
      previous = performance.now(),
      elapsed = 0,
      amount = 0,
      ready = false;
    let width = 1,
      height = 1,
      lastReset = -1,
      lastCamera = '',
      wasPlaying = false,
      playPhase = 0;
    const zoomBase = () => Math.max(0.88, 1.16 / camera.aspect);
    function setPose(preset, animate = true) {
      const scale = zoomBase();
      if (preset === 'top') pose.set(0.01, 64 * Math.max(1, 1 / camera.aspect), 0.1);
      else if (preset === 'front') pose.set(-52 * scale, 4 * scale, 0.01);
      else if (preset === 'side') pose.set(0, 9 * scale, 52 * scale);
      else pose.set(-31 * scale, 21 * scale, 34 * scale);
      cameraAnimating = animate && !reducedMotion;
      if (!cameraAnimating) camera.position.copy(pose);
      controls.target.set(0, 0.35, 0);
      controls.update();
    }
    const resize = new ResizeObserver((entries) => {
      const bounds = entries[0].contentRect;
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      setPose(propsRef.current.state.camera, false);
    });
    resize.observe(mount);
    setPose('perspective', false);
    const raycaster = new THREE.Raycaster(),
      pointer = new THREE.Vector2();
    let pointerDown = null;
    const down = (event) => {
      pointerDown = [event.clientX, event.clientY];
      cameraAnimating = false;
    };
    const up = (event) => {
      if (
        !pointerDown ||
        Math.hypot(event.clientX - pointerDown[0], event.clientY - pointerDown[1]) > 5
      )
        return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        (-(event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObject(aircraft.root, true).find((hit) => {
        let visible = true;
        hit.object.traverseAncestors((parent) => {
          if (!parent.visible) visible = false;
        });
        return visible && hit.object.visible && hit.object.userData.componentId;
      });
      propsRef.current.onSelect(hit?.object.userData.componentId || null);
      pointerDown = null;
    };
    renderer.domElement.addEventListener('pointerdown', down);
    renderer.domElement.addEventListener('pointerup', up);
    const contextLost = (event) => {
      event.preventDefault();
      setError('图形设备连接中断，请刷新页面恢复模型。');
    };
    renderer.domElement.addEventListener('webglcontextlost', contextLost);
    const projected = new THREE.Vector3();
    const labels = ANNOTATIONS.map((a) => ({
      ...a,
      part: aircraft.parts.find((p) => p.id === a.id),
      node: mount.querySelector(`[data-annotation="${a.id}"]`),
    }));

    function render(now) {
      const delta = Math.min((now - previous) / 1000, 0.05);
      previous = now;
      elapsed += delta;
      const current = propsRef.current.state;
      if (current.playing && !wasPlaying)
        playPhase = Math.asin(THREE.MathUtils.clamp(amount * 2 - 1, -1, 1));
      if (current.playing) playPhase += delta * 0.5;
      const targetAmount = current.playing ? (Math.sin(playPhase) + 1) / 2 : current.explosion;
      amount =
        reducedMotion || current.playing
          ? targetAmount
          : THREE.MathUtils.damp(amount, targetAmount, 5, delta);
      wasPlaying = current.playing;
      aircraft.update({
        mode: current.mode,
        explosion: amount,
        selected: current.selected,
        time: reducedMotion ? 0 : elapsed,
      });
      aircraft.root.position.y = amount * 2;
      grid.visible = current.grid;
      groundRef.visible = current.grid;
      controls.autoRotate = current.autoRotate && !cameraAnimating;
      if (lastReset !== current.resetId || lastCamera !== current.camera) {
        setPose(current.camera, ready);
        lastReset = current.resetId;
        lastCamera = current.camera;
      }
      if (cameraAnimating) {
        camera.position.lerp(pose, 1 - Math.exp(-5 * delta));
        if (camera.position.distanceTo(pose) < 0.02) {
          camera.position.copy(pose);
          cameraAnimating = false;
        }
      }
      controls.update();
      aircraft.root.updateMatrixWorld();
      labels.forEach(({ node, part, offset }) => {
        projected.copy(part.anchor);
        part.group.localToWorld(projected);
        projected.project(camera);
        const x = (projected.x * 0.5 + 0.5) * width,
          y = (-projected.y * 0.5 + 0.5) * height;
        const visible =
          current.labels &&
          projected.z < 1 &&
          x > 30 &&
          x < width - 30 &&
          y > 105 &&
          y < height - 115;
        node.style.display = visible ? '' : 'none';
        node.style.transform = `translate(${x}px, ${y}px)`;
        const targetX = Math.max(70, Math.min(width - 115, x + offset[0]));
        const targetY = Math.max(122, Math.min(height - 162, y + offset[1]));
        node.style.setProperty('--label-x', `${targetX - x}px`);
        node.style.setProperty('--label-y', `${targetY - y}px`);
        node.style.setProperty('--line-length', `${Math.hypot(targetX - x, targetY - y)}px`);
        node.style.setProperty('--line-angle', `${Math.atan2(targetY - y, targetX - x)}rad`);
      });
      renderer.render(scene, camera);
      renderer.domElement.dataset.mode = current.mode;
      renderer.domElement.dataset.explosion = amount.toFixed(3);
      if (!ready) {
        ready = true;
        propsRef.current.onReady();
      }
      frame = requestAnimationFrame(render);
    }
    frame = requestAnimationFrame(render);
    apiRef.current = {
      getExplosion: () => amount,
      zoom: (factor) => {
        cameraAnimating = false;
        const offset = camera.position.clone().sub(controls.target);
        offset.setLength(
          THREE.MathUtils.clamp(
            offset.length() * factor,
            controls.minDistance,
            controls.maxDistance,
          ),
        );
        camera.position.copy(controls.target).add(offset);
        controls.update();
      },
      export: () => {
        renderer.render(scene, camera);
        return renderer.domElement.toDataURL('image/png');
      },
    };
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', down);
      renderer.domElement.removeEventListener('pointerup', up);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      aircraft.dispose();
      environment.dispose();
      grid.geometry.dispose();
      grid.material.dispose();
      shadow.geometry.dispose();
      shadow.material.dispose();
      groundRef.traverse((o) => {
        o.geometry?.dispose();
        o.material?.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
      apiRef.current = null;
    };
  }, []);

  return (
    <div className="scene-mount" ref={mountRef}>
      {ANNOTATIONS.map((a) => (
        <div className="annotation" data-annotation={a.id} key={a.id}>
          <span className="annotation-point" />
          <span className="annotation-line" />
          <button
            className={`annotation-label ${state.selected === a.id ? 'selected' : ''}`}
            onClick={() => onSelect(a.id)}
          >
            <span>{a.number}</span>
            {a.label}
            <i />
          </button>
        </div>
      ))}
      {error && (
        <div className="scene-error" role="alert">
          {error}
          <button onClick={() => window.location.reload()}>重新加载</button>
        </div>
      )}
    </div>
  );
});
