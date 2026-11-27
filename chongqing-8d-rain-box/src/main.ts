import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

import './style.css';
import {
  WeatherMode,
  ViewMode,
  DioramaStateOptions,
  DioramaMetrics,
  AnimatedEntity,
  DynamicUpdateContext,
} from './types';
import { createTextureBundle, createOfflineEnvMap } from './textures';
import { createSharedShaderUniforms } from './shaders';
import { buildExhibitionPlinth } from './scene/plinth';
import { buildTierSubway } from './scene/tierSubway';
import { buildTierStreet } from './scene/tierStreet';
import { buildTierSky } from './scene/tierSky';
import { buildWeatherSystem } from './weather';
import { ChongqingSoundscape } from './audio';
import { CadCalloutOverlay } from './callouts';

// Camera presets tuned specifically for 1440×810 museum exhibition framing:
// - hero: 3/4 view showing ALL 3 vertical tiers + brass plinth cleanly above bottom control dock!
// - street: Intimate 8D alley framing showing yellow taxis, 「重庆老火锅」 interior, lanterns, bluestone stairs, weeping banyan, AND Liziba monorail piercing the tower overhead!
// - explode: Elevated wide cutaway angle giving crisp separation for all 3 vertical tiers + 8 CAD callout cards!
const CAMERA_PRESETS: Record<ViewMode, { pos: THREE.Vector3; target: THREE.Vector3 }> = {
  hero: {
    pos: new THREE.Vector3(30.2, 16.2, 51.8),
    target: new THREE.Vector3(0.0, 3.8, -0.8),
  },
  street: {
    pos: new THREE.Vector3(-14.6, 3.8, 17.8),
    target: new THREE.Vector3(1.6, 7.6, -2.5),
  },
  explode: {
    pos: new THREE.Vector3(35.8, 19.6, 61.5),
    target: new THREE.Vector3(0.0, 8.2, -1.0),
  },
};

class ChongqingDioramaApp {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private composer: EffectComposer;
  private bloomPass: UnrealBloomPass;

  private sharedUniforms = createSharedShaderUniforms();
  private animated: AnimatedEntity[] = [];
  private soundscape = new ChongqingSoundscape();
  private callouts = new CadCalloutOverlay();

  private tierSubwayGroup!: THREE.Group;
  private tierStreetGroup!: THREE.Group;
  private tierSkyGroup!: THREE.Group;
  private skySnowCaps: THREE.Object3D[] = [];

  // Runtime state
  private view: ViewMode = 'hero';
  private weather: WeatherMode = 'rain';
  private exploded = false;
  private convergence = false;
  private convergenceProgress = 0;
  private autoOrbit = false;

  private simTime = 0;
  private explodeFactor = 0;
  private rainWeight = 1;
  private sunWeight = 0;
  private snowWeight = 0;

  private targetCamPos = CAMERA_PRESETS.hero.pos.clone();
  private targetCamLook = CAMERA_PRESETS.hero.target.clone();
  private cameraTransitioning = false;

  private lastFrameMs = performance.now();
  private fpsSmoothed = 60;
  private rafId = 0;

  constructor() {
    this.container = document.getElementById('canvas-root')!;

    // 1. WebGLRenderer (Chrome Metal ANGLE Safe configuration)
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.04;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.info.autoReset = false;
    this.container.appendChild(this.renderer.domElement);

    // 2. Scene & Offline Procedural PMREM EnvMap
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x141b2b, 0.0068);
    this.scene.environment = createOfflineEnvMap(this.renderer);

    // 3. Camera & OrbitControls
    this.camera = new THREE.PerspectiveCamera(39, window.innerWidth / window.innerHeight, 0.2, 260);
    this.camera.position.copy(CAMERA_PRESETS.hero.pos);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.copy(CAMERA_PRESETS.hero.target);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.07;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 82;
    this.controls.maxPolarAngle = Math.PI * 0.56;
    this.controls.minPolarAngle = 0.18;
    this.controls.update();

    this.controls.addEventListener('start', () => {
      this.cameraTransitioning = false;
      this.autoOrbit = false;
    });

    // 4. Selective Post-Processing (HalfFloatType + MSAA + Selective Bloom threshold >= 0.90)
    // Chrome Metal SAFE: zero MeshPhysicalMaterial transmission > 0 anywhere in scene!
    const rt = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
      type: THREE.HalfFloatType,
      samples: 4,
    });
    this.composer = new EffectComposer(this.renderer, rt);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.34, // crisp subtle neon glow
      0.42,
      0.92 // >= 0.90 selective threshold protecting snow & daylight from whiteout!
    );
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(new OutputPass());

    // 5. Build Procedural Assets & 3-Tier 8D Chongqing Diorama
    this.buildScene();

    // 6. Bind UI Controls, Hotkeys & Deterministic Automation Hooks
    this.bindUI();
    this.registerAutomationHooks();

    window.addEventListener('resize', () => this.onResize());

    // Render initial deterministic frame & kick off loop
    this.stepSimulation(0.016);
    this.startLoop();
  }

  private buildScene(): void {
    const textures = createTextureBundle();

    const plinth = buildExhibitionPlinth(textures);
    this.scene.add(plinth.group);
    this.animated.push(...plinth.animated);

    const tierSubway = buildTierSubway(textures);
    this.tierSubwayGroup = tierSubway.group;
    this.scene.add(this.tierSubwayGroup);
    this.animated.push(...tierSubway.animated);

    const tierStreet = buildTierStreet(textures, this.sharedUniforms);
    this.tierStreetGroup = tierStreet.group;
    this.scene.add(this.tierStreetGroup);
    this.animated.push(...tierStreet.animated);

    const tierSky = buildTierSky(textures);
    this.tierSkyGroup = tierSky.group;
    this.skySnowCaps = tierSky.snowCaps;
    this.scene.add(this.tierSkyGroup);
    this.animated.push(...tierSky.animated);

    const allWarmLights = [...tierSubway.warmLights, ...tierStreet.warmLights];
    const weatherSys = buildWeatherSystem(this.scene, allWarmLights);
    this.scene.add(weatherSys.group);
    this.animated.push(weatherSys.animated);
  }

  private bindUI(): void {
    // View buttons
    document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const v = btn.dataset.view as ViewMode;
        this.setView(v, false);
      });
    });

    // Weather buttons
    document.querySelectorAll<HTMLButtonElement>('[data-weather]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const w = btn.dataset.weather as WeatherMode;
        this.setWeather(w, false);
      });
    });

    // Convergence button
    const btnConv = document.getElementById('btn-convergence')!;
    btnConv.addEventListener('click', () => {
      this.toggleConvergence();
    });

    // Audio button
    const btnAudio = document.getElementById('btn-audio')!;
    btnAudio.addEventListener('click', () => {
      const playing = this.soundscape.toggle();
      btnAudio.classList.toggle('playing', playing);
    });

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '1') {
        this.setView('hero', false);
      } else if (e.key === '2') {
        this.setView('street', false);
      } else if (e.key === '3') {
        const order: WeatherMode[] = ['rain', 'sun', 'snow'];
        const next = order[(order.indexOf(this.weather) + 1) % order.length];
        this.setWeather(next, false);
      } else if (e.key === '4') {
        this.setView(this.view === 'explode' ? 'hero' : 'explode', false);
      } else if (e.code === 'Space') {
        e.preventDefault();
        this.toggleConvergence();
      } else if (e.key === 'm' || e.key === 'M') {
        const playing = this.soundscape.toggle();
        btnAudio.classList.toggle('playing', playing);
      }
    });
  }

  private syncHUD(): void {
    document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.view === this.view);
    });
    document.querySelectorAll<HTMLButtonElement>('[data-weather]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.weather === this.weather);
    });
    document.getElementById('btn-convergence')?.classList.toggle('active', this.convergence);
    document.body.classList.toggle('weather-sun', this.weather === 'sun');
    document.body.classList.toggle('weather-snow', this.weather === 'snow');

    const statusSky = document.getElementById('status-sky');
    const statusStreet = document.getElementById('status-street');
    const statusSub = document.getElementById('status-sub');
    if (statusSky && statusStreet && statusSub) {
      if (this.convergence) {
        statusSky.textContent = '+16m 单轨·索道交汇';
        statusStreet.textContent = '0m 渝A车流齐聚';
        statusSub.textContent = '-10m 地铁进站';
      } else if (this.exploded) {
        statusSky.textContent = '+16m 天空层拆解';
        statusStreet.textContent = '0m 街巷层拆解';
        statusSub.textContent = '-10m 地下层拆解';
      } else {
        statusSky.textContent = '+16m 单轨穿楼';
        statusStreet.textContent = '0m 梯坎老街';
        statusSub.textContent = '-10m 穿山地铁';
      }
    }
  }

  private setView(view: ViewMode, snap: boolean): void {
    this.view = view;
    this.exploded = view === 'explode';
    const preset = CAMERA_PRESETS[view];
    this.targetCamPos.copy(preset.pos);
    this.targetCamLook.copy(preset.target);

    if (snap) {
      this.camera.position.copy(preset.pos);
      this.controls.target.copy(preset.target);
      this.controls.update();
      this.cameraTransitioning = false;
      this.explodeFactor = this.exploded ? 1 : 0;
    } else {
      this.cameraTransitioning = true;
    }

    this.callouts.setVisible(this.exploded);
    this.syncHUD();
  }

  private setWeather(weather: WeatherMode, snap: boolean): void {
    this.weather = weather;
    this.soundscape.setWeather(weather);
    if (snap) {
      this.rainWeight = weather === 'rain' ? 1 : 0;
      this.sunWeight = weather === 'sun' ? 1 : 0;
      this.snowWeight = weather === 'snow' ? 1 : 0;
    }
    this.syncHUD();
  }

  private toggleConvergence(force?: boolean): void {
    this.convergence = force !== undefined ? force : !this.convergence;
    if (this.convergence) {
      this.convergenceProgress = 0;
      this.soundscape.triggerConvergenceChime();
    }
    this.syncHUD();
  }

  private stepSimulation(dt: number): void {
    const safeDt = Math.max(0, Math.min(dt, 0.25));
    this.simTime += safeDt;

    if (this.convergence) {
      this.convergenceProgress = (this.convergenceProgress + safeDt * 0.22) % 1;
    }

    // Smoothly blend weather weights
    const blendRate = Math.min(1, safeDt * 3.8);
    this.rainWeight = THREE.MathUtils.lerp(this.rainWeight, this.weather === 'rain' ? 1 : 0, blendRate);
    this.sunWeight = THREE.MathUtils.lerp(this.sunWeight, this.weather === 'sun' ? 1 : 0, blendRate);
    this.snowWeight = THREE.MathUtils.lerp(this.snowWeight, this.weather === 'snow' ? 1 : 0, blendRate);

    // Smooth vertical 3-tier explode interpolation
    const targetExplode = this.exploded ? 1 : 0;
    this.explodeFactor = THREE.MathUtils.lerp(this.explodeFactor, targetExplode, Math.min(1, safeDt * 4.5));
    const easeExplode = this.explodeFactor * this.explodeFactor * (3 - 2 * this.explodeFactor);

    // Separate the 3 tiers cleanly along vertical guide axes
    this.tierSubwayGroup.position.y = easeExplode * -0.4;
    this.tierStreetGroup.position.y = easeExplode * 3.4;
    this.tierSkyGroup.position.y = easeExplode * 7.6;

    // Update sky snow caps visibility
    const showSnow = this.snowWeight > 0.2;
    for (const sc of this.skySnowCaps) {
      sc.visible = showSnow;
    }

    // Calibrate bloom strength & tone mapping exposure per weather mode (strictly ZERO snow/sun whiteout!)
    this.bloomPass.strength = this.rainWeight * 0.34 + this.sunWeight * 0.14 + this.snowWeight * 0.24;
    this.bloomPass.threshold = this.rainWeight * 0.91 + this.sunWeight * 0.96 + this.snowWeight * 0.95;
    this.renderer.toneMappingExposure = this.rainWeight * 1.05 + this.sunWeight * 1.0 + this.snowWeight * 0.98;

    // Update shared GLSL uniforms
    this.sharedUniforms.uTime.value = this.simTime;
    this.sharedUniforms.uRainWeight.value = this.rainWeight;
    this.sharedUniforms.uSunWeight.value = this.sunWeight;
    this.sharedUniforms.uSnowWeight.value = this.snowWeight;

    // Smooth camera transitions or optional autoOrbit
    if (this.cameraTransitioning) {
      const k = Math.min(1, safeDt * 5.2);
      this.camera.position.lerp(this.targetCamPos, k);
      this.controls.target.lerp(this.targetCamLook, k);
      if (
        this.camera.position.distanceToSquared(this.targetCamPos) < 0.002 &&
        this.controls.target.distanceToSquared(this.targetCamLook) < 0.002
      ) {
        this.camera.position.copy(this.targetCamPos);
        this.controls.target.copy(this.targetCamLook);
        this.cameraTransitioning = false;
      }
    } else if (this.autoOrbit) {
      const angle = safeDt * 0.25;
      const offset = this.camera.position.clone().sub(this.controls.target);
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
      this.camera.position.copy(this.controls.target).add(offset);
    }
    this.controls.update();

    // Update all animated entities
    const ctx: DynamicUpdateContext = {
      time: this.simTime,
      dt: safeDt,
      weather: this.weather,
      rainWeight: this.rainWeight,
      sunWeight: this.sunWeight,
      snowWeight: this.snowWeight,
      convergence: this.convergence,
      convergenceProgress: this.convergenceProgress,
      explodeFactor: easeExplode,
    };
    for (const entity of this.animated) {
      entity.update(ctx);
    }

    // Update matrices & project CAD callout cards if visible
    this.scene.updateMatrixWorld();
    this.camera.updateMatrixWorld();
    this.callouts.update(
      this.camera,
      {
        sky: this.tierSkyGroup,
        street: this.tierStreetGroup,
        subway: this.tierSubwayGroup,
      },
      window.innerWidth,
      window.innerHeight
    );

    // Render via selective bloom EffectComposer (reset info manually so metrics report true scene triangles & draw calls!)
    this.renderer.info.reset();
    this.composer.render();
  }

  private startLoop(): void {
    const tick = (now: number) => {
      const dt = Math.min(0.1, Math.max(0.001, (now - this.lastFrameMs) / 1000));
      this.lastFrameMs = now;
      this.fpsSmoothed = this.fpsSmoothed * 0.9 + (1 / dt) * 0.1;

      this.stepSimulation(dt);
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private onResize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
    this.bloomPass.setSize(w, h);
  }

  private registerAutomationHooks(): void {
    window.__setDioramaState = (opts: DioramaStateOptions) => {
      if (opts.weather) {
        this.setWeather(opts.weather, true);
      }
      if (opts.view) {
        this.setView(opts.view, true);
      }
      if (opts.exploded !== undefined) {
        this.exploded = opts.exploded;
        this.explodeFactor = opts.exploded ? 1 : 0;
        if (opts.exploded && this.view !== 'explode') {
          this.view = 'explode';
        }
        this.callouts.setVisible(this.exploded);
        this.syncHUD();
      }
      if (opts.convergence !== undefined) {
        this.toggleConvergence(opts.convergence);
      }
      if (opts.autoOrbit !== undefined) {
        this.autoOrbit = opts.autoOrbit;
      }
      if (opts.time !== undefined) {
        this.simTime = opts.time;
      }
      this.stepSimulation(0);
    };

    window.__advanceSimulation = (dt: number) => {
      this.stepSimulation(dt);
    };

    window.__setCameraPose = (pos: [number, number, number], target: [number, number, number]) => {
      this.cameraTransitioning = false;
      this.camera.position.set(pos[0], pos[1], pos[2]);
      this.controls.target.set(target[0], target[1], target[2]);
      this.controls.update();
      this.stepSimulation(0);
    };

    window.__getDioramaMetrics = (): DioramaMetrics => {
      const info = this.renderer.info.render;
      const cad = this.callouts.computeQualityMetrics(window.innerWidth, window.innerHeight);
      return {
        fps: Math.round(this.fpsSmoothed),
        triangles: info.triangles,
        drawCalls: info.calls,
        weather: this.weather,
        view: this.view,
        exploded: this.exploded,
        convergence: this.convergence,
        calloutCount: cad.calloutCount,
        calloutOverlaps: cad.calloutOverlaps,
        calloutOutOfBounds: cad.calloutOutOfBounds,
      };
    };
  }
}

new ChongqingDioramaApp();
