const effects = {
    build() {
        const env_canvas = document.createElement('canvas');
        env_canvas.width = 512;
        env_canvas.height = 256;
        const paint = env_canvas.getContext('2d');
        const gradient = paint.createLinearGradient(0, 0, 0, 256);
        gradient.addColorStop(0, '#8da7b4');
        gradient.addColorStop(0.43, '#566a77');
        gradient.addColorStop(0.52, '#242e32');
        gradient.addColorStop(1, '#342923');
        paint.fillStyle = gradient;
        paint.fillRect(0, 0, 512, 256);
        paint.fillStyle = '#e2c796';
        paint.fillRect(58, 67, 44, 38);
        paint.fillStyle = '#c0d6dd';
        paint.fillRect(293, 60, 100, 45);
        const env_texture = new THREE.CanvasTexture(env_canvas);
        env_texture.colorSpace = THREE.SRGBColorSpace;
        env_texture.mapping = THREE.EquirectangularReflectionMapping;
        const pmrem = new THREE.PMREMGenerator(renderer);
        this.env_target = pmrem.fromEquirectangular(env_texture);
        scene.environment = this.env_target.texture;
        pmrem.dispose();
        env_texture.dispose();
        const dust_count = 880;
        const dust_positions = new Float32Array(dust_count * 3);
        const dust_seeds = new Float32Array(dust_count * 3);
        for (let i = 0; i < dust_count; i++) {
            const source = i % 3;
            dust_positions[i * 3] = source === 0 ? -8.5 + rng.next() * 2 : source === 1 ? -4.6 + rng.next() * 1.6 : -7.8 + rng.next() * 2;
            dust_positions[i * 3 + 1] = source === 2 ? 0.55 : -0.9;
            dust_positions[i * 3 + 2] = source === 0 ? -2.1 : source === 1 ? 1.2 : 5.6;
            dust_seeds[i * 3] = rng.next();
            dust_seeds[i * 3 + 1] = rng.next();
            dust_seeds[i * 3 + 2] = rng.next();
        }
        const dust_geometry = new THREE.BufferGeometry();
        dust_geometry.setAttribute('position', new THREE.BufferAttribute(dust_positions, 3));
        dust_geometry.setAttribute('a_seed', new THREE.BufferAttribute(dust_seeds, 3));
        this.dust_material = new THREE.ShaderMaterial({
            uniforms: { u_time: { value: 0 }, u_strength: { value: 0.4 }, u_size: { value: innerHeight }, u_night: { value: 0 } },
            vertexShader: `attribute vec3 a_seed; uniform float u_time; uniform float u_size; varying float v_alpha; varying float v_tint;
                void main(){
                    float life=fract(a_seed.x+u_time*(.046+a_seed.y*.022));
                    vec3 point=position;
                    point.x+=(life*1.5+sin(life*6.+a_seed.z*6.)*.45);
                    point.z+=(a_seed.z-.5)*1.2+life*.25;
                    point.y+=life*(2.7+a_seed.y*1.6);
                    vec4 view=modelViewMatrix*vec4(point,1.);
                    gl_Position=projectionMatrix*view;
                    gl_PointSize=clamp(u_size*(.026+a_seed.y*.048)/-view.z,1.2,27.);
                    v_alpha=sin(life*3.14159)*(.2+a_seed.y*.45);
                    v_tint=a_seed.z;
                }`,
            fragmentShader: `uniform float u_strength; uniform float u_night; varying float v_alpha; varying float v_tint;
                void main(){
                    float edge=length(gl_PointCoord-.5)*2.;
                    float opacity=pow(max(0.,1.-edge),2.)*v_alpha*u_strength;
                    vec3 color=mix(vec3(.70,.54,.36),vec3(.87,.73,.51),v_tint);
                    color*=1.-u_night*.42;
                    gl_FragColor=vec4(color,opacity);
                }`,
            transparent: true,
            depthWrite: false,
            toneMapped: false,
        });
        this.dust_points = new THREE.Points(dust_geometry, this.dust_material);
        this.dust_points.frustumCulled = false;
        scene.add(this.dust_points);
        const rain_count = 2400;
        const rain_positions = new Float32Array(rain_count * 6);
        const rain_seeds = new Float32Array(rain_count * 4);
        for (let i = 0; i < rain_count; i++) {
            const pos_x = -14.2 + rng.next() * 28.4;
            const pos_z = -9.6 + rng.next() * 19.2;
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
                    float floor_y=.06;
                    if(point.x>-10.&&point.x<-2.&&abs(point.z)<3.9) floor_y=-1.25;
                    if(point.x>.22&&point.x<7.92&&point.z>-4.05&&point.z<4.23) floor_y=7.27;
                    if(point.x>4.91&&point.x<10.64&&point.z>-6.84&&point.z<-4.35) floor_y=3.35;
                    if(point.x>-9.13&&point.x<-2.13&&point.z>-6.74&&point.z<-4.59) floor_y=2.33;
                    if(point.x>-9.2&&point.x<-3.8&&point.z>4.9&&point.z<6.6) floor_y=1.2;
                    float life=fract(a_seed.x+u_time*(.73+a_seed.x*.24));
                    point.y=floor_y+(1.-life)*(15.-floor_y)+a_seed.y*.31;
                    v_fade=smoothstep(0.,.12,life)*(1.-smoothstep(.83,1.,life));
                    gl_Position=projectionMatrix*modelViewMatrix*vec4(point,1.);
                }`,
            fragmentShader: `uniform float u_rain; varying float v_fade; void main(){gl_FragColor=vec4(.64,.79,.87,u_rain*v_fade*.47);}`,
            transparent: true,
            depthWrite: false,
            toneMapped: false,
        });
        this.rain_lines = new THREE.LineSegments(rain_geometry, this.rain_material);
        this.rain_lines.frustumCulled = false;
        this.rain_lines.visible = false;
        scene.add(this.rain_lines);
        this.puddle_material = new THREE.ShaderMaterial({
            uniforms: { u_time: { value: 0 }, u_rain: { value: 0 }, u_night: { value: 0 } },
            vertexShader: `varying vec2 v_uv; varying vec3 v_world; void main(){v_uv=uv;vec4 world=modelMatrix*vec4(position,1.);v_world=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}`,
            fragmentShader: `uniform float u_time; uniform float u_rain; uniform float u_night; varying vec2 v_uv; varying vec3 v_world;
                void main(){
                    vec2 coord=(v_uv-.5)*2.;
                    float radius=length(coord);
                    float border=1.-smoothstep(.64+.04*sin(atan(coord.y,coord.x)*11.),1.,radius);
                    float ripple=sin(radius*48.-u_time*9.)*.023;
                    float highlight=pow(max(0.,1.-abs(coord.x+.17+sin(coord.y*18.+u_time)*.035)*3.),5.)*(.4+.6*cos(coord.y*3.));
                    vec3 color=mix(vec3(.29,.39,.44),vec3(.12,.19,.27),u_night);
                    color+=vec3(.9,.60,.27)*highlight*(.3+u_night*.8)+ripple;
                    gl_FragColor=vec4(color,border*u_rain*.64);
                }`,
            transparent: true,
            depthWrite: false,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            toneMapped: false,
        });
        this.puddles = [];
        const puddle_geometry = new THREE.PlaneGeometry(1, 1);
        for (let i = 0; i < 21; i++) {
            const puddle = new THREE.Mesh(puddle_geometry, this.puddle_material);
            puddle.rotation.x = -Math.PI / 2;
            if (i < 14) {
                puddle.position.set(-10.5 + (i % 7) * 3.45 + rng.next() * 0.7, 0.038, (i < 7 ? 7.55 : -8.35) + rng.next() * 0.55);
                puddle.scale.set(1.5 + rng.next() * 0.9, 0.6 + rng.next() * 0.6, 1);
            } else {
                puddle.position.set(i % 2 ? 12.65 : -12.65, 0.038, -5.5 + (i - 14) * 1.75);
                puddle.scale.set(0.85, 1.2 + rng.next() * 0.9, 1);
            }
            scene.add(puddle);
            this.puddles.push(puddle);
        }
        for (const point of [[-11, 3.6, 0], [4, 4.1, 5.5], [7.8, 3.8, -4.25]]) {
            const light = new THREE.PointLight(0xffc078, 0.8, 12, 2);
            light.position.set(...point);
            scene.add(light);
            lighting.point_lights.push(light);
        }
        this.beam_material = new THREE.ShaderMaterial({
            uniforms: { u_light: { value: 0 } },
            vertexShader: `varying vec3 v_local; void main(){v_local=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
            fragmentShader: `uniform float u_light; varying vec3 v_local; void main(){float vertical=(v_local.y+1.58)/3.16;float fade=sin(clamp(vertical,0.,1.)*3.14159);gl_FragColor=vec4(1.,.71,.35,u_light*fade*.065);}`,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            toneMapped: false,
        });
        const cone_geometry = new THREE.ConeGeometry(0.72, 3.16, 16, 1, true);
        for (const [pos_x, pos_z] of [[-14.04, -5.5], [-14.04, 5.6], [13.99, -2.3], [2.5, 5.55]]) {
            const cone = new THREE.Mesh(cone_geometry, this.beam_material);
            cone.position.set(pos_x, 1.69, pos_z);
            scene.add(cone);
        }
    },
    update() {
        this.dust_material.uniforms.u_time.value = state.time;
        this.dust_material.uniforms.u_strength.value = [0, 0.43, 1.2][state.dust] * (1 - state.rain * 0.97);
        this.dust_material.uniforms.u_night.value = state.night;
        this.dust_points.visible = state.dust > 0 && state.rain < 0.99;
        this.rain_material.uniforms.u_time.value = state.real_time;
        this.rain_material.uniforms.u_rain.value = state.rain;
        this.rain_lines.visible = state.rain > 0.005;
        this.puddle_material.uniforms.u_time.value = state.real_time;
        this.puddle_material.uniforms.u_rain.value = state.rain;
        this.puddle_material.uniforms.u_night.value = state.night;
        this.beam_material.uniforms.u_light.value = Math.min(1, state.night + state.rain * 0.5);
        for (const puddle of this.puddles) puddle.visible = state.rain > 0.005;
    },
};
