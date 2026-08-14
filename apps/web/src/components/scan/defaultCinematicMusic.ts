type MusicHandle = {
  stop: () => void;
};

const CHORDS = [
  [261.63, 329.63, 392.0, 130.81],
  [220.0, 261.63, 329.63, 110.0],
  [174.61, 220.0, 261.63, 87.31],
  [196.0, 246.94, 293.66, 98.0],
];

const STEP_MS = 4200;

export function startDefaultCinematicMusic(): MusicHandle | null {
  const AudioContextCtor = window.AudioContext ||
    (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextCtor) return null;

  const context = new AudioContextCtor();
  const master = context.createGain();
  master.gain.setValueAtTime(0.0001, context.currentTime);
  master.gain.exponentialRampToValueAtTime(0.045, context.currentTime + 1.2);
  master.connect(context.destination);

  const oscillators = CHORDS[0].map((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = index === 3 ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    gain.gain.setValueAtTime(index === 3 ? 0.18 : 0.08, context.currentTime);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start();
    return oscillator;
  });

  let chordIndex = 0;
  const tick = () => {
    chordIndex = (chordIndex + 1) % CHORDS.length;
    const chord = CHORDS[chordIndex];
    const now = context.currentTime;
    oscillators.forEach((oscillator, index) => {
      oscillator.frequency.cancelScheduledValues(now);
      oscillator.frequency.setTargetAtTime(chord[index]!, now, 0.9);
    });
  };

  const interval = window.setInterval(tick, STEP_MS);

  void context.resume().catch(() => undefined);

  return {
    stop: () => {
      window.clearInterval(interval);
      const now = context.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setTargetAtTime(0.0001, now, 0.35);
      window.setTimeout(() => {
        oscillators.forEach((oscillator) => {
          try {
            oscillator.stop();
          } catch {
            // Already stopped.
          }
        });
        void context.close().catch(() => undefined);
      }, 900);
    },
  };
}
