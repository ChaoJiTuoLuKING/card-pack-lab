import { cardsPerPack, type Finish } from './cards';
// Web Audio synthesis from prism-holo-pack. See public/THIRD-PARTY-NOTICES.txt.
const muteKey = 'meadow-card-pack:muted';
const effectsGain = 2.3;
export type CardCue = 'foil' | 'bag' | 'coin' | 'step' | 'hop' | 'signal' | 'spoon' | 'fabric';

export function readMuted() {
  try {
    return localStorage.getItem(muteKey) === '1';
  } catch {
    return false;
  }
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function pentatonicFreq(step: number) {
  const scale = [0, 2, 4, 7, 9];
  const octave = Math.floor(step / 5);
  const midi = 72 + octave * 12 + scale[((step % 5) + 5) % 5];
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function makeAudio(ctx: AudioContext, muted: boolean) {
  const sr = ctx.sampleRate;
  const now = () => ctx.currentTime;

  const master = ctx.createGain();
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -10;
  compressor.knee.value = 6;
  compressor.ratio.value = 8;
  compressor.attack.value = 0.002;
  compressor.release.value = 0.1;

  const reverb = ctx.createConvolver();
  const wet = ctx.createGain();
  wet.gain.value = 0.3;
  master.gain.value = muted ? 0 : effectsGain;

  master.connect(compressor).connect(ctx.destination);
  reverb.connect(wet).connect(master);

  const buildBuffer = (
    channels: number,
    seconds: number,
    filler: (samples: Float32Array) => void,
  ) => {
    const buf = ctx.createBuffer(channels, Math.floor(seconds * sr), sr);
    for (let ch = 0; ch < channels; ch++) filler(buf.getChannelData(ch));
    return buf;
  };

  const whiteNoise = buildBuffer(1, 2.0, (data) => {
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  });

  const foilCrackle = buildBuffer(1, 2.0, (data) => {
    for (let n = 0; n < 880; n++) {
      const offset = Math.floor(Math.random() * (data.length - 380));
      const amp = Math.pow(Math.random(), 2.9) * (Math.random() < 0.5 ? -1 : 1);
      const span = 28 + Math.floor(Math.random() * 240);
      for (let i = 0; i < span; i++) {
        data[offset + i] += amp * (Math.random() * 2 - 1) * Math.exp((-i / span) * 4.8);
      }
    }
  });

  reverb.buffer = buildBuffer(2, 0.85, (data) => {
    let lp = 0;
    for (let i = 0; i < data.length; i++) {
      const u = i / data.length;
      lp += (Math.random() * 2 - 1 - lp) * (0.48 - 0.4 * u);
      data[i] = lp * Math.pow(1 - u, 3);
    }
  });

  const route = (node: AudioNode, sendLevel = 0) => {
    node.connect(master);
    if (sendLevel > 0) {
      const send = ctx.createGain();
      send.gain.value = sendLevel;
      node.connect(send).connect(reverb);
    }
  };

  const envelope = (
    param: AudioParam,
    start: number,
    peak: number,
    attack: number,
    duration: number,
  ) => {
    param.setValueAtTime(0.0001, start);
    param.exponentialRampToValueAtTime(Math.max(0.0002, peak), start + attack);
    param.exponentialRampToValueAtTime(0.0001, start + duration);
  };

  const playFilteredNoise = ({
    at = now(),
    buffer = whiteNoise,
    filterType = 'bandpass',
    freqStart = 1200,
    freqEnd = 2400,
    q = 0.9,
    gain = 0.1,
    attack = 0.004,
    dur = 0.15,
    send = 0,
    panStart = 0,
    panEnd = 0,
    smoothBell = false,
  }: {
    at?: number;
    buffer?: AudioBuffer;
    filterType?: BiquadFilterType;
    freqStart?: number;
    freqEnd?: number;
    q?: number;
    gain?: number;
    attack?: number;
    dur?: number;
    send?: number;
    panStart?: number;
    panEnd?: number;
    smoothBell?: boolean;
  }) => {
    const src = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const g = ctx.createGain();
    const panner = ctx.createStereoPanner();

    src.buffer = buffer;
    src.loop = true;
    filter.type = filterType;
    filter.Q.value = q;
    filter.frequency.setValueAtTime(freqStart, at);
    filter.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), at + dur);

    if (smoothBell) {
      const curve = Float32Array.from(
        { length: 40 },
        (_, i) => gain * Math.pow(Math.sin((Math.PI * i) / 39), 2),
      );
      g.gain.setValueCurveAtTime(curve, at, dur);
    } else {
      envelope(g.gain, at, gain, attack, dur);
    }

    panner.pan.setValueAtTime(clamp(panStart, -1, 1), at);
    panner.pan.linearRampToValueAtTime(clamp(panEnd, -1, 1), at + dur);

    src.connect(filter).connect(g).connect(panner);
    route(panner, send);
    src.start(at, Math.random() * 1.5);
    src.stop(at + dur + 0.02);
  };

  const playToneContour = (
    baseFreq: number,
    points: [number, number][],
    {
      at = now(),
      gain = 0.06,
      attack = 0.008,
      vibrato = 0,
      send = 0.25,
      pan = 0,
      wave = 'triangle',
    }: {
      at?: number;
      gain?: number;
      attack?: number;
      vibrato?: number;
      send?: number;
      pan?: number;
      wave?: OscillatorType;
    } = {},
  ) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const panner = ctx.createStereoPanner();
    const dur = points[points.length - 1][0] + 0.05;

    osc.type = wave;
    panner.pan.value = clamp(pan, -1, 1);
    for (const [sec, mult] of points) {
      if (sec === 0) osc.frequency.setValueAtTime(baseFreq * mult, at);
      else osc.frequency.exponentialRampToValueAtTime(baseFreq * mult, at + sec);
    }
    envelope(g.gain, at, gain, attack, dur);

    if (vibrato > 0) {
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 23;
      lfoGain.gain.value = baseFreq * vibrato;
      lfo.connect(lfoGain).connect(osc.frequency);
      lfo.start(at);
      lfo.stop(at + dur + 0.02);
    }

    osc.connect(g).connect(panner);
    route(panner, send);
    osc.start(at);
    osc.stop(at + dur + 0.02);
  };

  const playBell = (
    freq: number,
    { at = now(), gain = 0.09, dur = 0.45, send = 0.55, pan = 0 } = {},
  ) => {
    const g = ctx.createGain();
    const panner = ctx.createStereoPanner();
    g.gain.value = gain;
    panner.pan.value = clamp(pan, -1, 1);
    g.connect(panner);
    route(panner, send);

    for (const [harmonic, amp, decayRatio] of [
      [1, 1, 1],
      [3.95, 0.17, 0.22],
      [9.1, 0.05, 0.08],
    ]) {
      const osc = ctx.createOscillator();
      const og = ctx.createGain();
      const life = Math.max(0.03, dur * decayRatio);
      osc.frequency.value = freq * harmonic;
      envelope(og.gain, at, amp, 0.002, life);
      osc.connect(og).connect(g);
      osc.start(at);
      osc.stop(at + life + 0.02);
    }
  };

  const ripSource = ctx.createBufferSource();
  const ripBand = ctx.createBiquadFilter();
  const ripLowpass = ctx.createBiquadFilter();
  const ripGain = ctx.createGain();

  ripSource.buffer = foilCrackle;
  ripSource.loop = true;
  ripBand.type = 'bandpass';
  ripBand.Q.value = 0.65;
  ripLowpass.type = 'lowpass';
  ripLowpass.frequency.value = 6200;
  ripGain.gain.value = 0;

  ripSource.connect(ripBand).connect(ripLowpass).connect(ripGain);
  route(ripGain, 0.12);
  ripSource.start();

  let currentRip = 0;
  let lastBrush = -Infinity;
  const lastCue = new Map<CardCue, number>();

  return {
    context: ctx,
    mute(flag: boolean) {
      master.gain.setTargetAtTime(flag ? 0 : effectsGain, now(), 0.015);
    },
    brush(speed: number, pan: number) {
      const t = now();
      if (t - lastBrush < 0.14) return;
      lastBrush = t;
      playFilteredNoise({
        buffer: foilCrackle,
        freqStart: 1150 + 950 * speed,
        freqEnd: 2100 + 1000 * speed,
        q: 0.65,
        gain: 0.10 + 0.11 * speed,
        dur: 0.09 + 0.03 * speed,
        smoothBell: true,
        panStart: pan * 0.55,
        panEnd: pan * 0.55,
      });
    },
    rip(intensity: number) {
      const v = clamp(intensity, 0, 1);
      if (Math.abs(v - currentRip) < 0.01 && (v > 0 || currentRip === 0)) return;
      const t = now();
      const rising = v > currentRip;
      currentRip = v;
      ripGain.gain.setTargetAtTime(Math.pow(v, 0.72) * 0.35, t, rising ? 0.008 : 0.048);
      ripBand.frequency.setTargetAtTime(1750 + 2100 * v, t, 0.02);
      ripSource.playbackRate.setTargetAtTime(0.72 + 0.82 * v, t, 0.02);
    },
    grab() {
      playFilteredNoise({
        buffer: foilCrackle,
        freqStart: 3100,
        freqEnd: 2100,
        q: 0.7,
        gain: 0.37,
        attack: 0.003,
        dur: 0.09,
      });
    },
    tug() {
      playToneContour(
        1220,
        [
          [0, 0.84],
          [0.05, 1.26],
          [0.13, 1.02],
        ],
        { gain: 0.05, vibrato: 0.04 },
      );
    },
    rebound() {
      const t = now();
      playToneContour(
        880,
        [
          [0, 1.1],
          [0.24, 0.62],
        ],
        { at: t, gain: 0.05, send: 0.42 },
      );
      playFilteredNoise({
        at: t,
        freqStart: 1500,
        freqEnd: 680,
        q: 0.6,
        gain: 0.03,
        attack: 0.02,
        dur: 0.25,
      });
    },
    shake(finish: Finish, awaken: boolean) {
      const t = now();
      playFilteredNoise({
        at: t,
        buffer: foilCrackle,
        freqStart: 2400,
        freqEnd: 3600,
        q: 0.8,
        gain: 0.22,
        attack: 0.005,
        dur: 0.11,
        panStart: -0.35,
        panEnd: 0.35,
      });
      playFilteredNoise({
        at: t + 0.08,
        buffer: foilCrackle,
        freqStart: 3200,
        freqEnd: 2000,
        q: 0.8,
        gain: 0.18,
        attack: 0.005,
        dur: 0.1,
        panStart: 0.35,
        panEnd: -0.2,
      });
      if (finish !== 'dew')
        playBell(pentatonicFreq(finish === 'astral' ? 12 : 9), {
          at: t + 0.06,
          gain: 0.045,
          dur: 0.45,
          send: 0.8,
        });
      if (awaken)
        [7, 9, 12, 14].forEach((step, i) =>
          playBell(pentatonicFreq(step), {
            at: t + 0.18 + i * 0.085,
            gain: 0.05,
            dur: 0.85,
            send: 0.9,
            pan: (i - 1.5) * 0.22,
          }),
        );
    },
    open(awaken: boolean) {
      const t = now();
      playFilteredNoise({
        at: t,
        freqStart: 4800,
        freqEnd: 1750,
        q: 0.9,
        gain: 0.20,
        attack: 0.002,
        dur: 0.1,
      });
      playToneContour(
        310,
        [
          [0, 0.8],
          [0.05, 3.3],
        ],
        { at: t, gain: 0.28, send: 0.15 },
      );
      playFilteredNoise({
        at: t + 0.01,
        freqStart: 520,
        freqEnd: 3300,
        q: 0.8,
        gain: 0.09,
        attack: 0.2,
        dur: 0.68,
        send: 0.6,
      });
      const bellCount = awaken ? 9 : 4;
      for (let i = 0; i < bellCount; i++) {
        const step = (awaken ? 9 : 7) + Math.floor(Math.random() * 6);
        playBell(pentatonicFreq(step), {
          at: t + 0.08 + i * 0.055,
          gain: 0.032,
          dur: 0.42,
          send: 0.85,
          pan: Math.random() * 1.4 - 0.7,
        });
      }
    },
    swirl(duration: number) {
      playFilteredNoise({
        freqStart: 720,
        freqEnd: 1850,
        q: 0.9,
        gain: 0.11,
        attack: duration * 0.38,
        dur: duration,
        send: 0.4,
        panStart: -0.65,
        panEnd: 0.55,
      });
    },
    land(slotIndex: number) {
      const pan = (slotIndex / (cardsPerPack - 1) - 0.5) * 0.76;
      playFilteredNoise({
        freqStart: 2500,
        freqEnd: 1250,
        q: 0.6,
        gain: 0.065,
        attack: 0.002,
        dur: 0.05,
        panStart: pan,
        panEnd: pan,
      });
    },
    cardCue(cue: CardCue, pan: number) {
      const t = now();
      if (t - (lastCue.get(cue) ?? -1) < 0.18) return;
      lastCue.set(cue, t);
      const noise = (freqStart: number, freqEnd: number, gain: number, dur: number, delay = 0) =>
        playFilteredNoise({ at: t + delay, freqStart, freqEnd, gain, dur, attack: 0.008, panStart: pan, panEnd: pan });
      switch (cue) {
        case 'foil':
          noise(1400, 3500, 0.19, 0.13);
          break;
        case 'bag':
          noise(3400, 1500, 0.29, 0.075);
          noise(4200, 2000, 0.22, 0.09, 0.08);
          break;
        case 'coin':
          playBell(1720, { gain: 0.11, dur: 0.17, pan });
          playBell(1110, { at: t + 0.055, gain: 0.085, dur: 0.24, pan });
          break;
        case 'step':
          noise(860, 340, 0.30, 0.08);
          break;
        case 'hop':
          playToneContour(340, [[0, 1], [0.085, 1.65]], { gain: 0.1, pan });
          break;
        case 'signal':
          playToneContour(770, [[0, 1], [0.065, 1.28]], { wave: 'sine', gain: 0.095, pan });
          break;
        case 'spoon':
          noise(1350, 780, 0.20, 0.07);
          playBell(630, { gain: 0.07, dur: 0.16, pan });
          break;
        case 'fabric':
          noise(1450, 640, 0.22, 0.23);
          break;
      }
    },
    hover(slot: number, revealed: boolean) {
      const pan = (slot / (cardsPerPack - 1) - 0.5) * 0.76;
      if (revealed) {
        playFilteredNoise({
          filterType: 'lowpass',
          freqStart: 760,
          freqEnd: 480,
          q: 0.32,
          gain: 0.04,
          smoothBell: true,
          dur: 0.2,
          panStart: pan,
          panEnd: pan,
        });
      } else {
        playBell(pentatonicFreq(7), { gain: 0.022, dur: 0.28, send: 0.75, pan });
      }
    },
    flip(slotIndex: number, finish: Finish) {
      const t = now();
      const pan = (slotIndex / (cardsPerPack - 1) - 0.5) * 0.76;
      // 翻牌破空声
      playFilteredNoise({
        at: t,
        freqStart: 900,
        freqEnd: 2900,
        q: 0.75,
        gain: 0.11,
        attack: 0.008,
        dur: 0.14,
        panStart: pan,
        panEnd: pan,
      });

      const chord =
        finish === 'astral'
          ? [5, 7, 9, 11, 12, 14]
          : finish === 'amber'
            ? [5, 7, 9, 12]
            : [5, 7, 9];
      if (finish !== 'dew')
        playToneContour(
          finish === 'astral' ? 164.8 : 196,
          [
            [0, 1],
            [0.25, 2],
          ],
          { at: t, gain: 0.09, send: 0.55, pan },
        );
      chord.forEach((st, idx) => {
        playBell(pentatonicFreq(st), {
          at: t + 0.03 + idx * 0.055,
          gain: 0.055,
          dur: 0.52,
          send: 0.75,
          pan,
        });
      });
    },
    arrive() {
      const t = now();
      playFilteredNoise({
        at: t,
        freqStart: 900,
        freqEnd: 2550,
        gain: 0.06,
        attack: 0.28,
        dur: 0.72,
        send: 0.4,
        panStart: 0.7,
        panEnd: 0,
      });
      playFilteredNoise({
        at: t + 0.7,
        buffer: foilCrackle,
        freqStart: 3000,
        freqEnd: 2150,
        q: 0.7,
        gain: 0.15,
        attack: 0.003,
        dur: 0.09,
      });
      playToneContour(
        pentatonicFreq(3),
        [
          [0, 0.9],
          [0.05, 1.03],
        ],
        { at: t + 0.76, gain: 0.048 },
      );
      playToneContour(
        pentatonicFreq(5),
        [
          [0, 0.9],
          [0.06, 1.03],
        ],
        { at: t + 0.85, gain: 0.048 },
      );
    },
    click() {
      playToneContour(
        880,
        [
          [0, 0.9],
          [0.045, 1.14],
        ],
        { gain: 0.04, send: 0 },
      );
    },
  };
}
export function createPackSound(initialMuted: boolean) {
  let muted = initialMuted;
  let audio: ReturnType<typeof makeAudio> | undefined;
  let unavailable = false;

  function start() {
    if (!audio && !unavailable) {
      const Audio =
        window.AudioContext ??
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Audio) return;
      let context: AudioContext | undefined;
      try {
        context = new Audio({ latencyHint: 'interactive' });
        audio = makeAudio(context, muted);
      } catch {
        unavailable = true;
        void context?.close().catch(() => {});
      }
    }
    if (audio?.context.state === 'suspended') void audio.context.resume().catch(() => {});
    return audio;
  }

  return {
    brush(speed: number, pan: number) {
      if (muted || navigator.userActivation?.hasBeenActive === false) return;
      const player = start();
      if (player?.context.state === 'running') player.brush(speed, pan);
    },
    cardCue(cue: CardCue, pan: number) {
      if (!muted) start()?.cardCue(cue, pan);
    },
    grab() {
      if (!muted) start()?.grab();
    },
    rip(intensity: number) {
      audio?.rip(muted ? 0 : intensity);
    },
    tug() {
      if (!muted) audio?.tug();
    },
    hover(slot: number, revealed: boolean) {
      if (!muted) audio?.hover(slot, revealed);
    },
    rebound() {
      if (!muted) audio?.rebound();
    },
    shake(finish: Finish, awaken: boolean) {
      if (!muted && (audio || navigator.userActivation?.hasBeenActive !== false))
        start()?.shake(finish, awaken);
    },
    open(awaken: boolean) {
      if (!muted) start()?.open(awaken);
    },
    arrive() {
      if (!muted) start()?.arrive();
    },
    swirl(duration: number) {
      if (!muted) audio?.swirl(duration);
    },
    land(slot: number) {
      if (!muted) audio?.land(slot);
    },
    flip(slot: number, finish: Finish) {
      if (!muted) start()?.flip(slot, finish);
    },
    setMuted(value: boolean) {
      muted = value;
      if (!value) start();
      audio?.mute(value);
      if (!value) audio?.click();
      try {
        localStorage.setItem(muteKey, value ? '1' : '0');
      } catch {
        // The current session can still use the toggle.
      }
    },
    dispose() {
      if (audio) void audio.context.close().catch(() => {});
      audio = undefined;
    },
  };
}

export type PackSound = ReturnType<typeof createPackSound>;
