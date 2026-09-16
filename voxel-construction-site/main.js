const orbit = {
    theta: 0.60,
    phi: 0.51,
    distance: 55,
    target_theta: 0.60,
    target_phi: 0.51,
    target_distance: 55,
    target: new THREE.Vector3(0, 2.2, 0),
    pointers: new Map(),
    last_input: 0,
    drag_distance: 0,
    pointer_start: new THREE.Vector2(),
    pointer_last: new THREE.Vector2(),
    raycaster: new THREE.Raycaster(),
    pointer_ndc: new THREE.Vector2(),
    build() {
        if (innerWidth / innerHeight < 1.2) this.target_distance = this.distance = 67;
        canvas.addEventListener('pointerdown', event => {
            if (event.button !== 0 && event.pointerType === 'mouse') return;
            this.pointers.set(event.pointerId, new THREE.Vector2(event.clientX, event.clientY));
            this.pointer_start.set(event.clientX, event.clientY);
            this.pointer_last.copy(this.pointer_start);
            this.drag_distance = 0;
            this.last_input = state.real_time;
            canvas.setPointerCapture(event.pointerId);
            canvas.style.cursor = 'grabbing';
            if (this.pointers.size === 2) {
                const points = [...this.pointers.values()];
                this.pinch_distance = points[0].distanceTo(points[1]);
            }
        });
        canvas.addEventListener('pointermove', event => {
            if (this.pointers.has(event.pointerId)) {
                const point = this.pointers.get(event.pointerId);
                const delta_x = event.clientX - point.x;
                const delta_y = event.clientY - point.y;
                point.set(event.clientX, event.clientY);
                this.drag_distance += Math.abs(delta_x) + Math.abs(delta_y);
                this.last_input = state.real_time;
                if (this.pointers.size === 1) {
                    this.target_theta -= delta_x * 0.006;
                    this.target_phi = THREE.MathUtils.clamp(this.target_phi + delta_y * 0.004, 0.24, 1.15);
                } else {
                    const points = [...this.pointers.values()];
                    const distance = points[0].distanceTo(points[1]);
                    this.target_distance = THREE.MathUtils.clamp(this.target_distance * this.pinch_distance / Math.max(10, distance), 31, 89);
                    this.pinch_distance = distance;
                }
            } else {
                this.pointer_ndc.set(event.clientX / innerWidth * 2 - 1, 1 - event.clientY / innerHeight * 2);
                this.raycaster.setFromCamera(this.pointer_ndc, camera);
                const hits = this.raycaster.intersectObjects(room.knobs.map(knob => knob.hit));
                canvas.style.cursor = hits.length ? 'pointer' : 'grab';
            }
        });
        canvas.addEventListener('pointerup', event => {
            if (this.pointers.size === 1 && this.drag_distance < 7) {
                this.pointer_ndc.set(event.clientX / innerWidth * 2 - 1, 1 - event.clientY / innerHeight * 2);
                this.raycaster.setFromCamera(this.pointer_ndc, camera);
                const hits = this.raycaster.intersectObjects(room.knobs.map(knob => knob.hit));
                if (hits.length) ui.change_control(hits[0].object.userData.control);
            }
            this.pointers.delete(event.pointerId);
            canvas.style.cursor = 'grab';
        });
        canvas.addEventListener('pointercancel', event => { this.pointers.delete(event.pointerId); });
        canvas.addEventListener('wheel', event => {
            event.preventDefault();
            this.target_distance = THREE.MathUtils.clamp(this.target_distance * Math.exp(event.deltaY * 0.001), 31, 89);
            this.last_input = state.real_time;
        }, { passive: false });
        canvas.addEventListener('contextmenu', event => event.preventDefault());
        window.addEventListener('resize', () => {
            camera.aspect = innerWidth / innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(innerWidth, innerHeight);
            effects.dust_material.uniforms.u_size.value = innerHeight * renderer.getPixelRatio();
        });
    },
    update(dt) {
        if (this.pointers.size === 0 && state.real_time - this.last_input > 10 && !document.getElementById('help').classList.contains('open')) this.target_theta += dt * 0.019;
        const blend = 1 - Math.exp(-dt * 10);
        this.theta = THREE.MathUtils.lerp(this.theta, this.target_theta, blend);
        this.phi = THREE.MathUtils.lerp(this.phi, this.target_phi, blend);
        this.distance = THREE.MathUtils.lerp(this.distance, this.target_distance, blend);
        camera.position.set(
            Math.sin(this.theta) * Math.cos(this.phi) * this.distance,
            this.target.y + Math.sin(this.phi) * this.distance,
            Math.cos(this.theta) * Math.cos(this.phi) * this.distance,
        );
        camera.lookAt(this.target);
    },
};
const ui = {
    speeds: [0, 0.5, 1, 2],
    last_second: -1,
    toast_timeout: null,
    build() {
        document.getElementById('speed-button').addEventListener('click', () => this.change_control(0));
        document.getElementById('day-button').addEventListener('click', () => this.change_control(1));
        document.getElementById('dust-button').addEventListener('click', () => this.change_control(2));
        document.getElementById('rain-button').addEventListener('click', () => this.toggle_rain());
        document.getElementById('home-button').addEventListener('click', () => {
            orbit.target_theta = 0.6;
            orbit.theta = THREE.MathUtils.euclideanModulo(orbit.theta + Math.PI, Math.PI * 2) - Math.PI;
            orbit.target_phi = 0.51;
            orbit.target_distance = innerWidth / innerHeight < 1.2 ? 67 : 55;
            orbit.last_input = state.real_time;
            this.toast('已返回全景视角');
        });
        document.getElementById('help-button').addEventListener('click', () => {
            document.getElementById('help').classList.add('open');
            document.getElementById('close-help').focus();
        });
        document.getElementById('close-help').addEventListener('click', () => {
            document.getElementById('help').classList.remove('open');
            orbit.last_input = state.real_time;
            document.getElementById('help-button').focus();
        });
        document.getElementById('help').addEventListener('click', event => {
            if (event.target.id === 'help') document.getElementById('close-help').click();
        });
        window.addEventListener('keydown', event => {
            if (event.code === 'Space' && !event.repeat) {
                if (document.getElementById('help').classList.contains('open')) return;
                event.preventDefault();
                this.toggle_rain();
            }
            if (event.code === 'Escape') document.getElementById('help').classList.remove('open');
            if (event.code === 'Tab' && document.getElementById('help').classList.contains('open')) {
                event.preventDefault();
                document.getElementById('close-help').focus();
            }
        });
        this.sync_controls();
    },
    change_control(index) {
        orbit.last_input = state.real_time;
        if (index === 0) {
            state.speed_index = (state.speed_index + 1) % this.speeds.length;
            state.speed = this.speeds[state.speed_index];
            this.toast(state.speed === 0 ? '设备已暂停，时间与天气继续流动' : `设备运行速度 · ${state.speed.toFixed(1)}×`);
        } else if (index === 1) {
            state.day_cycle = !state.day_cycle;
            this.toast(state.day_cycle ? '昼夜循环已开启 · 一天约 3 分钟' : '昼夜循环已暂停 · 留住此刻光影');
        } else {
            state.dust = (state.dust + 1) % 3;
            this.toast(`施工扬尘 · ${['关闭', '轻微', '浓郁'][state.dust]}${state.rain > 0.5 ? '（雨中自动抑尘）' : ''}`);
        }
        this.sync_controls();
    },
    toggle_rain() {
        state.rain_target = state.rain_target ? 0 : 1;
        document.getElementById('rain-button').classList.toggle('active', !!state.rain_target);
        document.getElementById('rain-button').setAttribute('aria-pressed', String(!!state.rain_target));
        this.toast(state.rain_target ? '暴雨将至 · 加强照明，地面逐渐湿润' : '雨势渐歇 · 地面积水缓缓退去');
    },
    sync_controls() {
        document.getElementById('speed-value').textContent = state.speed ? state.speed.toFixed(1) + '×' : '暂停';
        document.getElementById('day-value').textContent = state.day_cycle ? '循环' : '定格';
        document.getElementById('dust-value').textContent = ['关闭', '轻微', '浓郁'][state.dust];
        document.getElementById('live-status').textContent = state.speed ? '工地运行中' : '设备已暂停';
        document.getElementById('day-button').setAttribute('aria-pressed', String(state.day_cycle));
        room.knobs[0].angle = -1.5 + state.speed_index;
        room.knobs[1].angle = state.day_cycle ? 0.7 : -0.7;
        room.knobs[2].angle = (state.dust - 1) * 1.3;
    },
    toast(message) {
        const toast = document.getElementById('toast');
        clearTimeout(this.toast_timeout);
        toast.textContent = message;
        toast.classList.add('show');
        this.toast_timeout = setTimeout(() => toast.classList.remove('show'), 2600);
    },
    update(dt) {
        for (const knob of room.knobs) knob.group.rotation.y = THREE.MathUtils.lerp(knob.group.rotation.y, knob.angle, 1 - Math.exp(-dt * 12));
        const second = Math.floor(state.real_time);
        if (second === this.last_second) return;
        this.last_second = second;
        const minutes = Math.floor(state.day * 1440) % 1440;
        const hour = Math.floor(minutes / 60);
        document.getElementById('clock').textContent = String(hour).padStart(2, '0') + ':' + String(minutes % 60).padStart(2, '0');
        const phase = hour < 5 || hour >= 20 ? '夜晚' : hour < 8 ? '黎明' : hour < 17 ? '白昼' : '黄昏';
        document.getElementById('phase').textContent = (state.rain > 0.3 ? '暴雨' : '晴朗') + ' · ' + phase;
        document.getElementById('fps').textContent = Math.round(state.fps) + ' FPS';
    },
};
const app = {
    last_frame: 0,
    sample_time: 0,
    sample_frames: 0,
    frame_count: 0,
    slow_samples: 0,
    fast_samples: 0,
    build() {
        room.build();
        site.build(ctx);
        machines.build(ctx);
        effects.build();
        geo.flush();
        for (const knob of room.knobs) {
            knob.hit.userData.no_batch = true;
            geo.dynamic_batch(knob.group);
        }
        orbit.build();
        ui.build();
        orbit.update(1);
        lighting.update();
        effects.update();
        machines.update(0, 0, state);
        renderer.compile(scene, camera);
        this.last_frame = performance.now();
        document.addEventListener('visibilitychange', () => {
            this.last_frame = performance.now();
            this.sample_frames = 0;
            this.sample_time = 0;
        });
        canvas.addEventListener('webglcontextlost', event => {
            event.preventDefault();
            ui.toast('图形上下文已暂停，请稍候');
        });
        canvas.addEventListener('webglcontextrestored', () => location.reload());
        Object.defineProperty(window, 'sandbox_info', { get: () => ({
            ready: this.frame_count > 2,
            three_revision: THREE.REVISION,
            fps: Math.round(state.fps),
            pixel_ratio: renderer.getPixelRatio(),
            draw_calls: renderer.info.render.calls,
            triangles: renderer.info.render.triangles,
            static_instances: geo.count,
            rain: state.rain,
            speed: state.speed,
            dust: state.dust,
            day_cycle: state.day_cycle,
            day: state.day,
        }) });
        requestAnimationFrame(this.frame.bind(this));
    },
    frame(now) {
        requestAnimationFrame(this.frame.bind(this));
        if (document.hidden) { this.last_frame = now; return; }
        const raw_dt = (now - this.last_frame) / 1000;
        const dt = Math.min(raw_dt, 0.05);
        this.last_frame = now;
        state.real_time += dt;
        state.time += dt * state.speed;
        if (state.day_cycle) state.day = (state.day + dt / 180) % 1;
        state.rain = THREE.MathUtils.lerp(state.rain, state.rain_target, 1 - Math.exp(-dt * (state.rain_target ? 0.6 : 0.23)));
        orbit.update(dt);
        machines.update(dt * state.speed, state.time, state);
        lighting.update();
        effects.update();
        ui.update(dt);
        renderer.render(scene, camera);
        this.frame_count++;
        if (this.frame_count === 3) {
            document.getElementById('loader').style.opacity = '0';
            setTimeout(() => document.getElementById('loader').remove(), 700);
        }
        this.sample_frames++;
        this.sample_time += raw_dt;
        if (this.sample_time >= 2) {
            state.fps = this.sample_frames / this.sample_time;
            this.sample_frames = 0;
            this.sample_time = 0;
            if (state.real_time > 7) {
                this.slow_samples = state.fps < 51 ? this.slow_samples + 1 : 0;
                this.fast_samples = state.fps > 58 ? this.fast_samples + 1 : 0;
                const max_ratio = Math.min(devicePixelRatio, 1.5);
                if (this.slow_samples >= 2 && renderer.getPixelRatio() > 0.72) {
                    renderer.setPixelRatio(Math.max(0.7, renderer.getPixelRatio() - 0.15));
                    this.slow_samples = 0;
                } else if (this.fast_samples >= 8 && renderer.getPixelRatio() < max_ratio) {
                    renderer.setPixelRatio(Math.min(max_ratio, renderer.getPixelRatio() + 0.1));
                    this.fast_samples = 0;
                }
                document.getElementById('quality').textContent = renderer.getPixelRatio() < max_ratio - 0.05 ? '流畅优先' : '自适应画质';
            }
        }
    },
};
window.addEventListener('error', event => {
    const status = document.getElementById('loader-status');
    if (status) status.textContent = '加载遇到问题：' + event.message;
});
try {
    app.build();
} catch (error) {
    console.error(error);
    document.getElementById('loader-status').textContent = '无法建立 WebGL 场景：' + error.message;
}
