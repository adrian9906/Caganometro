let audioContext: AudioContext | null = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

export function primeFartSound() {
  const context = getAudioContext();
  if (context.state === "suspended") {
    void context.resume();
  }
}

export function playFartSound() {
  const context = getAudioContext();
  const start = context.currentTime;
  const duration = 0.45;

  const oscillator = context.createOscillator();
  const oscillatorGain = context.createGain();
  oscillator.type = "sawtooth";
  oscillator.frequency.setValueAtTime(115, start);
  oscillator.frequency.exponentialRampToValueAtTime(48, start + duration);
  oscillatorGain.gain.setValueAtTime(0.0001, start);
  oscillatorGain.gain.exponentialRampToValueAtTime(0.22, start + 0.025);
  oscillatorGain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let index = 0; index < channel.length; index += 1) {
    const envelope = 1 - index / channel.length;
    channel[index] = (Math.random() * 2 - 1) * envelope;
  }
  const noise = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const noiseGain = context.createGain();
  noise.buffer = buffer;
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(420, start);
  filter.frequency.exponentialRampToValueAtTime(120, start + duration);
  noiseGain.gain.setValueAtTime(0.16, start);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(oscillatorGain).connect(context.destination);
  noise.connect(filter).connect(noiseGain).connect(context.destination);
  oscillator.start(start);
  noise.start(start);
  oscillator.stop(start + duration);
  noise.stop(start + duration);
}
