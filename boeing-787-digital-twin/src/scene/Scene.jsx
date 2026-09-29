import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createAircraft } from './aircraft';
import { layoutAnnotations } from './annotations';
import { fitDistance } from './framing';
import { createRunway, sampleFlight } from './flight';
import { createAirflow } from './airflow';

const ANNOTATIONS = [
  { id: 'nose', number: '01', label: '机首与驾驶舱', offset: [-55, -72] },
  { id: 'tail', number: '07', label: '垂直安定面', offset: [44, -45] },
  { id: 'engine-right', number: '06', label: 'GEnx-1B 发动机', offset: [-45, 73] },
  { id: 'wing-right', number: '04', label: '复合材料机翼', offset: [45, 50] },
];

export const Scene = forwardRef(function Scene(
  { state, onSelect, onReady, onHover, onFocusChange },
  ref,
) {
  const mountRef = useRef(null),
    apiRef = useRef(null),
    propsRef = useRef({ state, onSelect, onReady, onHover, onFocusChange });
  const [error, setError] = useState('');
  propsRef.current = { state, onSelect, onReady, onHover, onFocusChange };
  useImperativeHandle(
    ref,
    () => ({
      zoom: (factor) => apiRef.current?.zoom(factor),
      export: () => apiRef.current?.export(),
      getExplosion: () => apiRef.current?.getExplosion() ?? 0,
      focus: (id) => apiRef.current?.focus(id),
      overview: () => apiRef.current?.overview(),
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
    const runway = createRunway();
    scene.add(runway.root);
    const airflow = createAirflow();
    scene.add(airflow.root);
    let wasFlying = false;
    let flightHeight = 0;
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
    const targetPose = new THREE.Vector3(0, 0.35, 0);
    let focusedPart = null,
      hovered = null,
      pendingFocus = null;
    let cameraAnimating = false,
      frame = 0,
      previous = performance.now(),
      elapsed = 0,
      amount = 0,
      ready = false;
    let width = 1,
      height = 1,
      labelMetricsDirty = true,
      lastReset = -1,
      lastCamera = '',
      lastMode = '',
      lastExplosion = 0,
      wasPlaying = false,
      playPhase = 0;
    const zoomBase = () => Math.max(0.88, 1.16 / camera.aspect);
    function setPose(preset, animate = true) {
      if (focusedPart) propsRef.current.onFocusChange?.(null);
      focusedPart = null;
      renderer.domElement.dataset.focusedPart = '';
      controls.maxDistance = Math.max(100, 90 / camera.aspect);
      const scale = zoomBase();
      if (preset === 'top') pose.set(0.01, 64 * Math.max(1, 1 / camera.aspect), 0.1);
      else if (preset === 'front') pose.set(-52 * scale, 4 * scale, 0.01);
      else if (preset === 'side') pose.set(0, 9 * scale, 52 * scale);
      else pose.set(-31 * scale, 21 * scale, 34 * scale);
      cameraAnimating = animate && !reducedMotion;
      controls.minDistance = cameraAnimating ? 5 : 24;
      targetPose.set(0, 0.35, 0);
      if (!cameraAnimating) {
        camera.position.copy(pose);
        controls.target.copy(targetPose);
      }
      controls.update();
    }
    function resetFlightCamera() {
      cameraAnimating = false;
      const scale = Math.max(1, 1.05 / camera.aspect);
      camera.position.set(-30 * scale, aircraft.root.position.y + 11 * scale, 40 * scale);
      controls.target.set(0, aircraft.root.position.y + 1 - 5 * scale, 0);
      controls.minDistance = 20;
      controls.maxDistance = Math.max(110, 100 / camera.aspect);
      controls.update();
    }
    const resize = new ResizeObserver((entries) => {
      const bounds = entries[0].contentRect;
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      labelMetricsDirty = true;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      if (!propsRef.current.state.flight) setPose(propsRef.current.state.camera, false);
      else controls.maxDistance = Math.max(110, 100 / camera.aspect);
    });
    resize.observe(mount);
    setPose('perspective', false);
    const raycaster = new THREE.Raycaster(),
      pointer = new THREE.Vector2();
    let pointerDown = null;
    const down = (event) => {
      pointerDown = [event.clientX, event.clientY];
      cameraAnimating = false;
      setHover(null);
      renderer.domElement.style.cursor = 'grabbing';
    };
    function hitAt(event) {
      if (propsRef.current.state.flight) return null;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        (-(event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObject(aircraft.root, true).find((hit) => {
        let visible = true;
        hit.object.traverseAncestors((parent) => {
          if (!parent.visible) visible = false;
        });
        return visible && hit.object.visible && hit.object.userData.componentId;
      });
    }
    function setHover(id) {
      if (hovered === id) return;
      hovered = id;
      propsRef.current.onHover?.(id);
      renderer.domElement.dataset.hoveredPart = id || '';
    }
    const move = (event) => {
      if (pointerDown || event.pointerType === 'touch') return;
      const id = hitAt(event)?.object.userData.componentId || null;
      setHover(id);
      renderer.domElement.style.cursor = id ? 'pointer' : 'grab';
    };
    const leave = () => {
      pointerDown = null;
      setHover(null);
      renderer.domElement.style.cursor = 'grab';
    };
    const up = (event) => {
      const start = pointerDown;
      pointerDown = null;
      renderer.domElement.style.cursor = 'grab';
      if (propsRef.current.state.flight) return;
      if (
        !start ||
        event.button !== 0 ||
        Math.hypot(event.clientX - start[0], event.clientY - start[1]) > 5
      )
        return;
      propsRef.current.onSelect(hitAt(event)?.object.userData.componentId || null);
    };
    renderer.domElement.addEventListener('pointerdown', down);
    renderer.domElement.addEventListener('pointerup', up);
    renderer.domElement.addEventListener('pointermove', move);
    renderer.domElement.addEventListener('pointerleave', leave);
    renderer.domElement.addEventListener('pointercancel', leave);
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
    document.fonts?.ready.then(() => {
      labelMetricsDirty = true;
    });

    function render(now) {
      const delta = Math.min((now - previous) / 1000, 0.05);
      previous = now;
      elapsed += delta;
      const current = propsRef.current.state;
      const flight = current.flight;
      const flightSample = flight && sampleFlight(flight.kind, flight.progress);
      const enteringFlight = flight && !wasFlying;
      if (flight && !wasFlying) {
        setPose('perspective', false);
        setHover(null);
        pendingFocus = null;
      }
      if (!flight && wasFlying) setPose(current.camera, false);
      wasFlying = Boolean(flight);
      if (current.playing && !wasPlaying)
        playPhase = Math.asin(THREE.MathUtils.clamp(amount * 2 - 1, -1, 1));
      if (current.playing) playPhase += delta * 0.5;
      const targetAmount = current.playing ? (Math.sin(playPhase) + 1) / 2 : current.explosion;
      amount =
        reducedMotion || current.playing
          ? targetAmount
          : THREE.MathUtils.damp(amount, targetAmount, 5, delta);
      wasPlaying = current.playing;
      if (flight) amount = 0;
      aircraft.update({
        mode: flight ? 'assembled' : current.mode,
        explosion: amount,
        selected: flight ? null : current.selected,
        hovered,
        focused: focusedPart,
        time: flight ? flight.progress * 150 : reducedMotion ? 0 : elapsed,
        gearExtension: flightSample?.gear ?? 1,
      });
      aircraft.root.rotation.z = flightSample ? -flightSample.pitch : 0;
      // Rotate around the main-wheel contact line during rotation and flare.
      aircraft.root.position.y = flightSample
        ? flightSample.altitude +
          1.75 * Math.sin(flightSample.pitch) +
          3 * (Math.cos(flightSample.pitch) - 1)
        : amount * 2;
      runway.root.visible = Boolean(flight);
      runway.root.position.x = flightSample?.distance ?? 0;
      if (flightSample) {
        airflow.root.position.copy(aircraft.root.position);
        airflow.root.rotation.copy(aircraft.root.rotation);
        airflow.update({
          ...flightSample,
          progress: flight.progress,
          enabled: flight.airflow !== false,
        });
      } else airflow.root.visible = false;
      grid.visible = current.grid && !flight;
      groundRef.visible = current.grid && !flight;
      shadow.visible = !flight;
      controls.enabled = true;
      controls.maxPolarAngle = flight ? Math.PI / 2 - 0.015 : Math.PI / 2 + 0.15;
      controls.autoRotate = current.autoRotate && !cameraAnimating;
      if (
        lastReset !== current.resetId ||
        lastCamera !== current.camera ||
        (focusedPart &&
          (current.selected !== focusedPart ||
            lastMode !== current.mode ||
            lastExplosion !== current.explosion ||
            current.playing))
      ) {
        setPose(current.camera, ready);
        lastReset = current.resetId;
        lastCamera = current.camera;
      }
      lastMode = current.mode;
      lastExplosion = current.explosion;
      if (pendingFocus) {
        focusPart(pendingFocus);
        pendingFocus = null;
      }
      if (cameraAnimating) {
        camera.position.lerp(pose, 1 - Math.exp(-5 * delta));
        controls.target.lerp(targetPose, 1 - Math.exp(-5 * delta));
        if (
          camera.position.distanceTo(pose) < 0.02 &&
          controls.target.distanceTo(targetPose) < 0.02
        ) {
          camera.position.copy(pose);
          controls.target.copy(targetPose);
          cameraAnimating = false;
          if (!focusedPart) controls.minDistance = 24;
        }
      }
      if (flight) {
        cameraAnimating = false;
        controls.autoRotate = false;
        if (enteringFlight) resetFlightCamera();
        else {
          // Translate the orbit with the aircraft without overwriting the user's view.
          const rise = aircraft.root.position.y - flightHeight;
          camera.position.y += rise;
          controls.target.y += rise;
        }
        flightHeight = aircraft.root.position.y;
      }
      controls.update(delta);
      aircraft.root.updateMatrixWorld();
      if (labelMetricsDirty) {
        for (const label of labels) {
          label.node.style.display = '';
          const button = label.node.querySelector('button');
          label.width = button.offsetWidth;
          label.height = button.offsetHeight;
        }
        labelMetricsDirty = false;
      }
      const candidates = [];
      labels.forEach(({ id, node, part, offset, width: labelWidth, height: labelHeight }) => {
        projected.copy(part.anchor);
        part.group.localToWorld(projected);
        projected.project(camera);
        const x = (projected.x * 0.5 + 0.5) * width,
          y = (-projected.y * 0.5 + 0.5) * height;
        const visible =
          current.labels &&
          !flight &&
          (!focusedPart || focusedPart === part.id) &&
          projected.z < 1 &&
          x > 30 &&
          x < width - 30 &&
          y > 105 &&
          y < height - 115;
        node.style.display = visible ? '' : 'none';
        node.style.transform = `translate(${x}px, ${y}px)`;
        if (visible) {
          candidates.push({
            id,
            node,
            x,
            y,
            offset,
            width: labelWidth,
            height: labelHeight,
          });
        }
      });
      candidates.sort(
        (a, b) => Number(b.id === current.selected) - Number(a.id === current.selected),
      );
      const placed = layoutAnnotations(candidates, {
        width,
        height,
        obstacles: [{ x: width - 52, y: height * 0.38, width: 52, height: 210 }],
      });
      for (const item of candidates) {
        const box = placed.find((p) => p.id === item.id);
        item.node.style.display = box ? '' : 'none';
        if (!box) continue;
        const dx = box.x + 40 - item.x,
          dy = box.y + 10 - item.y;
        item.node.style.setProperty('--label-x', `${dx}px`);
        item.node.style.setProperty('--label-y', `${dy}px`);
        item.node.style.setProperty('--line-length', `${Math.hypot(dx, dy)}px`);
        item.node.style.setProperty('--line-angle', `${Math.atan2(dy, dx)}rad`);
      }
      renderer.render(scene, camera);
      renderer.domElement.dataset.mode = current.mode;
      renderer.domElement.dataset.explosion = amount.toFixed(3);
      renderer.domElement.dataset.flight = flight?.kind || '';
      renderer.domElement.dataset.flightProgress = flight?.progress.toFixed(3) || '';
      if (!ready) {
        ready = true;
        propsRef.current.onReady();
      }
      frame = requestAnimationFrame(render);
    }
    function focusPart(id) {
      const part = aircraft.parts.find((part) => part.id === id);
      if (!part) return;
      aircraft.root.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(
        id === 'nose' ? part.group.getObjectByName('cockpit-interior') : part.group,
      );
      if (bounds.isEmpty()) return;
      bounds.getCenter(targetPose);
      const side = id.endsWith('left') ? -1 : 1;
      const direction = id.startsWith('engine')
        ? [-1, 0.5, side * 1.25]
        : id.startsWith('wing')
          ? [-0.7, 1, side]
          : id === 'tail'
            ? [0.9, 0.6, 1]
            : id === 'landing-gear'
              ? [-1, 0.25, 0.45]
              : id === 'nose'
                ? [1, 0.9, 1]
                : [-1, 0.7, 1];
      const distance = fitDistance(
        bounds,
        new THREE.Vector3(...direction),
        camera.aspect,
        camera.fov,
      );
      pose
        .set(...direction)
        .normalize()
        .multiplyScalar(id === 'nose' ? distance * 1.22 : distance)
        .add(targetPose);
      controls.minDistance = 5;
      controls.maxDistance = Math.max(100, distance * 1.5);
      focusedPart = id;
      setHover(null);
      propsRef.current.onFocusChange?.(id);
      renderer.domElement.dataset.focusedPart = id;
      cameraAnimating = !reducedMotion;
      if (reducedMotion) {
        camera.position.copy(pose);
        controls.target.copy(targetPose);
        controls.update();
      }
    }
    frame = requestAnimationFrame(render);
    apiRef.current = {
      overview: () =>
        propsRef.current.state.flight
          ? resetFlightCamera()
          : setPose(propsRef.current.state.camera, true),
      focus: (id) => {
        pendingFocus = id;
      },
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
      renderer.domElement.removeEventListener('pointermove', move);
      renderer.domElement.removeEventListener('pointerleave', leave);
      renderer.domElement.removeEventListener('pointercancel', leave);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      aircraft.dispose();
      runway.dispose();
      airflow.dispose();
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
