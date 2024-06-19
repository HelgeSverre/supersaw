type Microseconds = number;
type Milliseconds = number;
type Seconds = number;
type Beats = number;
type Ticks = number;

export class TimeConverter {
  // Beats per minute
  public readonly bpm: number;

  // Ticks per beat (usually set in MIDI file header)
  public readonly ticksPerBeat: number;

  constructor(bpm: number, ticksPerBeat: number) {
    this.bpm = bpm;
    this.ticksPerBeat = ticksPerBeat;
  }

  // Milliseconds to Beats
  msToBeats(milliseconds: Milliseconds): Beats {
    return milliseconds / (60000 / this.bpm);
  }

  // Beats to Milliseconds
  beatsToMs(beats: Beats): Milliseconds {
    return beats * (60000 / this.bpm);
  }

  // Beats to Ticks
  beatsToTicks(beats: Beats): Ticks {
    return Math.round(beats * this.ticksPerBeat);
  }

  // Ticks to Beats
  ticksToBeats(ticks: Ticks): Beats {
    return ticks / this.ticksPerBeat;
  }

  // Milliseconds to Ticks
  msToTicks(milliseconds: Milliseconds): Ticks {
    const beats = this.msToBeats(milliseconds);
    return this.beatsToTicks(beats);
  }

  // Ticks to Milliseconds
  ticksToMs(ticks: Ticks): Milliseconds {
    const beats = this.ticksToBeats(ticks);
    return this.beatsToMs(beats);
  }

  // Seconds to Beats
  secondsToBeats(seconds: Seconds): Beats {
    return seconds * (this.bpm / 60);
  }

  // Beats to Seconds
  beatsToSeconds(beats: Beats): Seconds {
    return beats / (this.bpm / 60);
  }

  getMicrosecondsPerBeat(): Microseconds {
    return 60000000 / this.bpm;
  }
}

export class Durations {
  public static readonly WHOLE = 1;
  public static readonly HALF = 1 / 2;
  public static readonly QUARTER = 1 / 4;
  public static readonly EIGHTH = 1 / 8;
  public static readonly SIXTEENTH = 1 / 16;
  public static readonly THIRTY_SECOND = 1 / 32;
  public static readonly SIXTY_FOURTH = 1 / 64;
  public static readonly HUNDRED_TWENTY_EIGHTH = 1 / 128;
  public static readonly TWO_HUNDRED_FIFTY_SIXTH = 1 / 256;
  private bpm: number;

  constructor(bpm: number) {
    this.bpm = bpm;
  }

  msToBeats(milliseconds: Milliseconds): Beats {
    return milliseconds / (60000 / this.bpm);
  }

  public getWhole(): Milliseconds {
    return this.bpm / 4;
  }

  public getHalf(): Milliseconds {
    return this.bpm / 8;
  }

  public getQuarter(): Milliseconds {
    return this.bpm / 16;
  }

  public getEighth(): Milliseconds {
    return this.bpm / 32;
  }

  public getSixteenth(): Milliseconds {
    return this.bpm / 64;
  }
}
