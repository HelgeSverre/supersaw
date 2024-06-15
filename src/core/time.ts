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
