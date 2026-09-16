const effects = {
    build() {
        const env_canvas = document.createElement('canvas');
        env_canvas.width = 512;
        env_canvas.height = 256;
        const paint = env_canvas.getContext('2d');
        const gradient = paint.createLinearGradient(0, 0, 0, 256);
        gradient.addColorStop(0, '#3a4a5c');
        gradient.addColorStop(0.45, '#2a323c');
        gradient.addColorStop(0.55, '#241c1a');
        gradient.addColorStop(1, '#2c2018');
        paint.fillStyle = gradient;
        paint.fillRect(0, 0, 512, 256);
        paint.fillStyle = '#7a4a26';
        paint.fillRect(70, 120, 60, 30);
        paint.fillRect(300, 115, 90, 34);
        const env_texture = new THREE.CanvasTexture(env_canvas);
        env_texture.colorSpace = THREE.SRGBColorSpace;
        env_texture.mapping = THREE.EquirectangularReflectionMapping;
        const pmrem = new THREE.PMREMGenerator(renderer);
        this.env_target = pmrem.fromEquirectangular(env_texture);
        scene.environment = this.env_target.texture;
        pmrem.dispose();
        env_texture.dispose();

        // —— 汤锅蒸汽 ——
        const steam_count = 300;
        const steam_pos = new Float32Array(steam_count * 3);
        const steam_seed = new Float32Array(steam_count * 3);
        for (let i = 0; i < steam_count; i++) {
            const source = i % 4;
            steam_pos[i * 3] = source < 2 ? -4.55 + (rng.next() - 0.5) * 0.9 : source === 2 ? -3.2 + rng.next() * 1.4 : -1.2 + rng.next() * 2.2;
            steam_pos[i * 3 + 1] = source < 2 ? 1.85 : 1.45;
            steam_pos[i * 3 + 2] = source < 2 ? 1.7 + rng.next() * 0.35 : source === 2 ? 2.42 : 2.62;
            steam_seed[i * 3] = rng.next();
            steam_seed[i * 3 + 1] = rng.next();
            steam_seed[i * 3 + 2] = rng.next();
        }
        const steam_geometry = new THREE.BufferGeometry();
        steam_geometry.setAttribute('position', new THREE.BufferAttribute(steam_pos, 3));
        steam_geometry.setAttribute('a_seed', new THREE.BufferAttribute(steam_seed, 3));
        this.steam_material = new THREE.ShaderMaterial({
            uniforms: { u_time: { value: 0 }, u_strength: { value: 1 }, u_size: { value: innerHeight }, u_night: { value: 1 } },
            vertexShader: `attribute vec3 a_seed; uniform float u_time; uniform float u_size; varying float v_alpha;
                void main(){
                    float life=fract(a_seed.x+u_time*(.052+a_seed.y*.03));
                    vec3 point=position;
                    point.x+=sin(life*5.2+a_seed.z*7.)*.16*(.3+life)+life*.22;
                    point.z+=sin(life*4.1+a_seed.x*9.)*.14*(.3+life)+(a_seed.z-.5)*.3+life*.85;
                    point.y+=life*(1.7+a_seed.y*1.5);
                    vec4 view=modelViewMatrix*vec4(point,1.);
                    gl_Position=projectionMatrix*view;
                    gl_PointSize=clamp(u_size*(.16+a_seed.y*.3)*(.5+life)/-view.z,3.,90.);
                    v_alpha=sin(min(1.,life*1.25)*3.14159)*(.45+a_seed.y*.4);
                }`,
            fragmentShader: `uniform float u_strength; uniform float u_night; varying float v_alpha;
                void main(){
                    float edge=length(gl_PointCoord-.5)*2.;
                    float opacity=pow(max(0.,1.-edge),1.8)*v_alpha*u_strength;
                    vec3 color=mix(vec3(.86,.84,.82),vec3(.98,.9,.8),u_night);
                    gl_FragColor=vec4(color,opacity);
                }`,
            transparent: true,
            depthWrite: false,
            toneMapped: false,
        });
        this.steam_points = new THREE.Points(steam_geometry, this.steam_material);
        this.steam_points.frustumCulled = false;
        scene.add(this.steam_points);

        // —— 夜雨 ——（斜落雨丝，遇摊位屋顶与楼顶截止）
        const rain_count = 2300;
        const rain_positions = new Float32Array(rain_count * 6);
        const rain_seeds = new Float32Array(rain_count * 4);
        for (let i = 0; i < rain_count; i++) {
            const pos_x = -14.8 + rng.next() * 29.6;
            const pos_z = -10.2 + rng.next() * 20.4;
            const seed = rng.next();
            for (let j = 0; j < 2; j++) {
                rain_positions[i * 6 + j * 3] = pos_x;
                rain_positions[i * 6 + j * 3 + 1] = 0;
                rain_positions[i * 6 + j * 3 + 2] = pos_z;
                rain_seeds[i * 4 + j * 2] = seed;
                rain_seeds[i * 4 + j * 2 + 1] = j;
            }
        }
        const rain_geometry = new THREE.BufferGeometry();
        rain_geometry.setAttribute('position', new THREE.BufferAttribute(rain_positions, 3));
        rain_geometry.setAttribute('a_seed', new THREE.BufferAttribute(rain_seeds, 2));
        this.rain_material = new THREE.ShaderMaterial({
            uniforms: { u_time: { value: 0 }, u_rain: { value: 0 } },
            vertexShader: `attribute vec2 a_seed; uniform float u_time; varying float v_fade;
                void main(){
                    vec3 point=position;
                    float floor_y=.05;
                    if(point.z>6.85&&point.z<9.1) floor_y=.055;
                    if(point.z>9.25) floor_y=.055;
                    if(point.z<-0.68&&point.z>-3.82) floor_y=.05;
                    if(point.x>-6.6&&point.x<3.3&&point.z>-0.78&&point.z<3.68) floor_y=4.5+(3.6-point.z)*.186;
                    if(point.z<-4.55) floor_y=7.5;
                    if(point.x>7.2&&point.z>0.2&&point.z<9.35) floor_y=4.7;
                    float life=fract(a_seed.x+u_time*(.62+a_seed.x*.2));
                    float drop=life*(14.-floor_y);
                    point.x+=drop*.16;
                    point.y=floor_y+(1.-life)*(14.-floor_y)+a_seed.y*.42;
                    v_fade=smoothstep(0.,.1,life)*(1.-smoothstep(.86,1.,life));
                    gl_Position=projectionMatrix*modelViewMatrix*vec4(point,1.);
                }`,
            fragmentShader: `uniform float u_rain; varying float v_fade; void main(){gl_FragColor=vec4(.6,.72,.82,u_rain*v_fade*.4);}`,
            transparent: true,
            depthWrite: false,
            toneMapped: false,
        });
        this.rain_lines = new THREE.LineSegments(rain_geometry, this.rain_material);
        this.rain_lines.frustumCulled = false;
        this.rain_lines.visible = false;
        scene.add(this.rain_lines);

        // —— 水洼（涟漪 + 灯光高光） ——
        this.puddle_material = new THREE.ShaderMaterial({
            uniforms: { u_time: { value: 0 }, u_rain: { value: 0 }, u_night: { value: 1 } },
            vertexShader: `varying vec2 v_uv; void main(){v_uv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
            fragmentShader: `uniform float u_time; uniform float u_rain; uniform float u_night; varying vec2 v_uv;
                void main(){
                    vec2 coord=(v_uv-.5)*2.;
                    float radius=length(coord);
                    float border=1.-smoothstep(.6+.05*sin(atan(coord.y,coord.x)*9.),1.,radius);
                    float ripple=sin(radius*42.-u_time*8.5)*.03*u_rain;
                    float highlight=pow(max(0.,1.-abs(coord.x+.14+sin(coord.y*15.+u_time)*.04)*2.6),5.)*(.35+.65*cos(coord.y*2.6));
                    vec3 color=mix(vec3(.30,.36,.42),vec3(.10,.15,.24),u_night);
                    color+=vec3(1.,.62,.28)*highlight*(.25+u_night*.9)+ripple;
                    gl_FragColor=vec4(color,border*(u_rain*.62+u_night*.2));
                }`,
            transparent: true,
            depthWrite: false,
            polygonOffset: true,
            polygonOffsetFactor: -2,
            toneMapped: false,
        });
        this.puddles = [];
        const puddle_geometry = new THREE.PlaneGeometry(1, 1);
        const puddle_list = [
            [-9.5, 7.6, 2.4, 0.9], [2.6, 8.6, 1.7, 0.8], [-4.2, 8.2, 2.0, 0.7],
            [-6.8, 6.15, 1.8, 0.6], [6.4, 6.3, 1.4, 0.55], [10.4, 6.2, 1.5, 0.5],
            [-11.9, 6.1, 1.6, 0.7], [-8.6, -1.6, 1.7, 0.8], [4.4, -2.6, 1.3, 0.6],
            [11.4, -1.8, 1.4, 0.6], [13.0, 9.75, 1.2, 0.5], [-13.6, 9.6, 1.4, 0.5],
        ];
        for (const [px, pz, sx, sz] of puddle_list) {
            const puddle = new THREE.Mesh(puddle_geometry, this.puddle_material);
            puddle.rotation.x = -Math.PI / 2;
            puddle.position.set(px, 0.068, pz);
            puddle.scale.set(sx, sz, 1);
            scene.add(puddle);
            this.puddles.push(puddle);
        }

        // —— 湿地面长条倒影 ——（雨夜在路面/人行道/后巷拖出灯光光带）
        this.streak_material = new THREE.ShaderMaterial({
            uniforms: {
                u_time: { value: 0 }, u_wet: { value: 0 },
                u_cam: { value: new THREE.Vector3() },
                u_lights: { value: [
                    new THREE.Vector3(-4.55, 1.0, 1.15), new THREE.Vector3(-1.7, 1.0, 2.7),
                    new THREE.Vector3(-1.5, 1.0, 4.1), new THREE.Vector3(12.7, 1.0, -2.75),
                    new THREE.Vector3(8.6, 1.0, 5.85), new THREE.Vector3(11.9, 1.0, 8.5),
                    new THREE.Vector3(-4.55, 1.0, 1.15), new THREE.Vector3(7.4, 1.0, 2.2),
                ] },
                u_colors: { value: [
                    new THREE.Color(0xffb46a), new THREE.Color(0xffc890), new THREE.Color(0xffa050),
                    new THREE.Color(0xffd9a0), new THREE.Color(0xffd9a0), new THREE.Color(0xff5040),
                    new THREE.Color(0xffb46a), new THREE.Color(0x9adfe8),
                ] },
            },
            vertexShader: `varying vec3 v_world; void main(){vec4 world=modelMatrix*vec4(position,1.);v_world=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}`,
            fragmentShader: `
                uniform float u_time; uniform float u_wet; uniform vec3 u_cam;
                uniform vec3 u_lights[8]; uniform vec3 u_colors[8];
                varying vec3 v_world;
                void main(){
                    float streak=0.;
                    vec3 streak_color=vec3(0.);
                    for(int i=0;i<8;i++){
                        vec3 lp=u_lights[i];
                        vec2 to_f=v_world.xz-lp.xz;
                        float dist=length(to_f);
                        if(dist<.5||dist>9.) continue;
                        vec2 dir_f=to_f/dist;
                        vec2 to_c=u_cam.xz-lp.xz;
                        float dist_c=max(.6,length(to_c));
                        vec2 dir_c=to_c/dist_c;
                        float align=pow(max(0.,dot(dir_f,dir_c)),22.);
                        float falloff=exp(-dist*.28)*exp(-abs(dist-dist_c)*.1);
                        float shimmer=.75+.25*sin(v_world.x*7.+v_world.z*5.+u_time*2.2+float(i)*2.1);
                        streak+=align*falloff*shimmer;
                        streak_color+=u_colors[i]*align*falloff*shimmer;
                    }
                    float alpha=clamp(streak,0.,1.)*u_wet*.72;
                    gl_FragColor=vec4(streak_color*1.15,alpha);
                }`,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            polygonOffset: true,
            polygonOffsetFactor: -3,
            toneMapped: false,
        });
        const streak_mesh = new THREE.Mesh(new THREE.PlaneGeometry(29.6, 13.2), this.streak_material);
        streak_mesh.rotation.x = -Math.PI / 2;
        streak_mesh.position.set(0, 0.075, 2.65);
        scene.add(streak_mesh);

        // —— 暖帘随夜风摆动 ——（顶点着色器注入，顶端固定）
        this.noren_time = { value: 0 };
        street.noren_material.onBeforeCompile = shader => {
            shader.uniforms.u_noren_time = this.noren_time;
            shader.vertexShader = 'uniform float u_noren_time;\n' + shader.vertexShader.replace(
                '#include <begin_vertex>',
                `#include <begin_vertex>
                float noren_factor=clamp((0.5-transformed.y)/1.0,0.,1.);
                transformed.x+=sin(u_noren_time*1.7+transformed.y*5.1+position.z*7.)*.09*noren_factor;
                transformed.z+=sin(u_noren_time*1.25+transformed.y*3.7)*.06*noren_factor;`
            );
        };
        street.noren_material.needsUpdate = true;
    },
    update() {
        this.noren_time.value = state.real_time;
        this.steam_material.uniforms.u_time.value = state.time;
        this.steam_material.uniforms.u_night.value = state.night;
        this.steam_material.uniforms.u_strength.value = [0, 0.45, 1][state.steam] * (0.55 + state.night * 0.45) * (0.6 + state.speed * 0.4);
        this.steam_points.visible = state.steam > 0;
        this.rain_material.uniforms.u_time.value = state.real_time;
        this.rain_material.uniforms.u_rain.value = state.rain;
        this.rain_lines.visible = state.rain > 0.005;
        this.puddle_material.uniforms.u_time.value = state.real_time;
        this.puddle_material.uniforms.u_rain.value = state.rain;
        this.puddle_material.uniforms.u_night.value = state.night;
        this.streak_material.uniforms.u_time.value = state.real_time;
        this.streak_material.uniforms.u_wet.value = state.rain * (0.35 + state.night * 0.65);
        this.streak_material.uniforms.u_cam.value.copy(camera.position);
        for (const puddle of this.puddles) puddle.visible = state.rain > 0.02 || state.night > 0.3;
        // 夜色下摊位灯火
        const glow = 0.12 + state.night * 0.95 + state.rain * 0.35;
        street.sign_material.emissiveIntensity = 0.15 + state.night * 0.85 + state.rain * 0.3;
        street.sign_back_material.emissiveIntensity = 0.1 + state.night * 0.5;
        street.bulb_material.color.setHex(0xffd9a0).multiplyScalar(Math.min(1.25, 0.35 + state.night * 0.9 + state.rain * 0.3));
        street.window_lit_material.color.setHex(0x4d3418).multiplyScalar(Math.min(1.4, 0.4 + state.night * 1.1));
        street.vend_material.color.setHex(0x9adfe8).multiplyScalar(Math.min(1.3, 0.5 + state.night * 0.8));
        street.pot_bulb_material.color.setHex(0xffdca8).multiplyScalar(Math.min(1.3, 0.5 + state.night * 0.8));
        street.broth_material.emissiveIntensity = 0.2 + state.night * 0.5;
        street.road_material.roughness = THREE.MathUtils.lerp(0.95, 0.18, state.rain);
        street.road_material.metalness = THREE.MathUtils.lerp(0.03, 0.42, state.rain);
        street.road_material.color.setHex(0x43474c).lerp(new THREE.Color(0x2c3438), state.rain * 0.85);
        street.pave_material.roughness = THREE.MathUtils.lerp(0.93, 0.22, state.rain);
        street.pave_material.metalness = THREE.MathUtils.lerp(0.02, 0.38, state.rain);
        street.alley_material.roughness = THREE.MathUtils.lerp(0.96, 0.24, state.rain);
    },
};
