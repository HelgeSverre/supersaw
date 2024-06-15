export class Metronome {
  private audioContext: AudioContext;
  private bpm: number;
  private beatsPerMeasure: number;
  private isPlaying: boolean;
  private currentBeat: number;
  private nextNoteTime: number;
  private timerID: number | null;

  constructor(audioContext: AudioContext, bpm: number = 120, beatsPerMeasure: number = 4) {
    this.audioContext = audioContext;
    this.bpm = bpm;
    this.beatsPerMeasure = beatsPerMeasure;
    this.isPlaying = false;
    this.currentBeat = 0;
    this.nextNoteTime = 0.0; // when the next note is due
    this.timerID = null; // for the scheduler
  }

  setBpm(bpm: number): void {
    this.bpm = bpm;
  }

  public toggle(): void {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
  }

  public start(): void {
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.currentBeat = 0;
    this.nextNoteTime = this.audioContext.currentTime;
    this.scheduleTick(); // Start scheduling ticks
  }

  public stop(): void {
    this.isPlaying = false;
    if (this.timerID !== null) {
      clearTimeout(this.timerID);
      this.timerID = null;
    }
  }

  private scheduleTick(): void {
    // How far ahead to schedule audio (sec)
    const lookahead: number = 0.1;
    // How frequently to call scheduling function (ms)
    const scheduleInterval: number = 25;

    const scheduler = (): void => {
      while (this.nextNoteTime < this.audioContext.currentTime + lookahead) {
        this.playTick();
        this.calculateNextTick();
      }
      this.timerID = window.setTimeout(scheduler, scheduleInterval);
    };

    scheduler();
  }

  private playTick(): void {
    let osc = this.audioContext.createOscillator();
    let envelope = this.audioContext.createGain();

    osc.type = "square";
    osc.frequency.value = this.currentBeat % this.beatsPerMeasure === 0 ? 1000 : 800;
    osc.connect(envelope);
    envelope.connect(this.audioContext.destination);

    envelope.gain.setValueAtTime(0.1, this.nextNoteTime);
    envelope.gain.exponentialRampToValueAtTime(0.001, this.nextNoteTime + 0.1);
    osc.start(this.nextNoteTime);
    osc.stop(this.nextNoteTime + 0.2);

    this.currentBeat++;
  }

  private calculateNextTick(): void {
    const secondsPerBeat: number = 60.0 / this.bpm;
    this.nextNoteTime += secondsPerBeat; // Add beat length to last beat time

    // Wrap around beat number in each measure
    if (this.currentBeat === this.beatsPerMeasure) {
      this.currentBeat = 0;
    }
  }
}
