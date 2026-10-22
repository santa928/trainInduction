/** Gesture-activated local synthesis: no downloads or autoplay assumptions. */
export class RailwayAudio {
  private context: AudioContext | null = null;
  private enabled = true;
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
  async unlock() {
    if (!this.enabled) return;
    try {
      this.context ??= new AudioContext();
      if (this.context.state === "suspended") await this.context.resume();
    } catch {
      /* Audio is optional on devices with restrictive autoplay policies. */
    }
  }
  private note(
    frequency: number,
    time: number,
    duration: number,
    volume = 0.05,
    type: OscillatorType = "sine",
  ) {
    const context = this.context;
    if (!this.enabled || !context || context.state !== "running") return;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, context.currentTime + time);
    envelope.gain.setValueAtTime(0.001, context.currentTime + time);
    envelope.gain.exponentialRampToValueAtTime(
      volume,
      context.currentTime + time + 0.012,
    );
    envelope.gain.exponentialRampToValueAtTime(
      0.001,
      context.currentTime + time + duration,
    );
    oscillator.connect(envelope).connect(context.destination);
    oscillator.start(context.currentTime + time);
    oscillator.stop(context.currentTime + time + duration + 0.02);
  }
  place() {
    this.note(640, 0, 0.07, 0.045, "triangle");
    this.note(960, 0.045, 0.1, 0.035, "triangle");
  }
  returnPiece() {
    this.note(420, 0, 0.09, 0.03, "triangle");
  }
  chug() {
    this.note(85, 0, 0.065, 0.025, "triangle");
    this.note(120, 0.075, 0.05, 0.018, "triangle");
  }
  depart() {
    this.note(660, 0, 0.2);
    this.note(880, 0.22, 0.32);
  }
  fail() {
    this.note(330, 0, 0.16, 0.045);
    this.note(262, 0.18, 0.3, 0.04);
  }
  arrive() {
    [523, 659, 784, 1047].forEach((f, i) =>
      this.note(f, i * 0.14, i === 3 ? 0.65 : 0.22, 0.055, "triangle"),
    );
  }
  async suspend() {
    try {
      await this.context?.suspend();
    } catch {
      /* optional */
    }
  }
  dispose() {
    void this.context?.close();
    this.context = null;
  }
}
