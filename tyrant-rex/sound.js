import {ROAR} from './kinematics.mjs';

export function createSoundEngine() {
  let context, motor, motorGain;
  let throat, undertone, mouth, formant, roarGain;
  let wanted = false;

  function createVoices() {
    function gain(value, output) {
      const node = context.createGain();
      node.gain.value = value;
      node.connect(output);
      return node;
    }
    function oscillator(type, frequency, output) {
      const node = context.createOscillator();
      node.type = type;
      node.frequency.value = frequency;
      node.connect(output);
      node.start();
      return node;
    }
    function filter(type, frequency, resonance, output) {
      const node = context.createBiquadFilter();
      node.type = type;
      node.frequency.value = frequency;
      node.Q.value = resonance;
      node.connect(output);
      return node;
    }

    motorGain = gain(0, context.destination);
    motor = oscillator('sine', 58, motorGain);
    roarGain = gain(0, context.destination);
    mouth = filter('lowpass', 420, .92, roarGain);
    formant = filter('bandpass', 840, 1.25, gain(.85, roarGain));
    throat = oscillator('sawtooth', 65, mouth);
    throat.connect(formant);
    undertone = oscillator('sawtooth', 34, gain(.52, mouth));
    oscillator('sine', 24, gain(7, throat.frequency));
    oscillator('triangle', 9.4, gain(3, undertone.frequency));

    const noise = context.createBuffer(1, Math.ceil(context.sampleRate * 1.6), context.sampleRate);
    const samples = noise.getChannelData(0);
    let seed = 26317;
    for (let index = 0; index < samples.length; index++) {
      seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
      samples[index] = seed / 2147483648 - 1;
    }
    const breath = context.createBufferSource();
    breath.buffer = noise;
    breath.loop = true;
    breath.connect(filter('bandpass', 890, .68, gain(1.12, roarGain)));
    breath.start();
  }

  return {
    async setEnabled(enabled) {
      wanted = enabled;
      try {
        if (enabled) {
          if (!context) {
            const Audio = window.AudioContext || window.webkitAudioContext;
            if (!Audio) return false;
            context = new Audio();
          }
          await context.resume();
          if (!wanted || context.state !== 'running') return false;
          if (!motor) createVoices();
          return true;
        }
        if (context) {
          for (const node of motor ? [motorGain, roarGain] : []) {
            node.gain.cancelScheduledValues(context.currentTime);
            node.gain.setValueAtTime(0, context.currentTime);
          }
          await context.suspend();
        }
      } catch {
        return false;
      }
      return false;
    },
    tick(speed, moving, strength, phase) {
      if (!wanted || !motor || context.state !== 'running') return;
      const time = context.currentTime;
      const progress = Math.max(0, Math.min(1, (phase - ROAR.voiceStart) / (ROAR.voiceEnd - ROAR.voiceStart)));
      const pitch = 56 + 30 * strength - 24 * progress;
      motor.frequency.setTargetAtTime(44 + speed * 24, time, .1);
      motorGain.gain.setTargetAtTime(moving ? .012 : 0, time, .04);
      throat.frequency.setTargetAtTime(pitch, time, .04);
      undertone.frequency.setTargetAtTime(pitch * .51, time, .055);
      mouth.frequency.setTargetAtTime(250 + 470 * strength, time, .045);
      formant.frequency.setTargetAtTime(650 + 370 * strength - 150 * progress, time, .05);
      roarGain.gain.setTargetAtTime(.27 * strength ** 1.15, time, strength > 0 ? .045 : .03);
    },
    chime() {
      if (!wanted || !motor || context.state !== 'running') return;
      const voice = context.createOscillator(), envelope = context.createGain();
      const time = context.currentTime;
      voice.frequency.setValueAtTime(520, time);
      voice.frequency.exponentialRampToValueAtTime(850, time + .12);
      envelope.gain.setValueAtTime(.025, time);
      envelope.gain.exponentialRampToValueAtTime(.0001, time + .2);
      voice.connect(envelope).connect(context.destination);
      voice.start();
      voice.stop(time + .22);
      voice.onended = () => { voice.disconnect(); envelope.disconnect(); };
    },
  };
}
