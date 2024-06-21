const SECONDS_PER_MINUTE = 60;
const MS_PER_SECOND = 1000;
const MICROSECONDS_PER_SECOND = 1_000_000;

export type Seconds = number;
export type Milliseconds = number;
export type BPM = number;
export type Beats = number;
export type TimeOffset = Time;

export type TimeSignature = [beatsPerMeasure: number, noteValue: number];

export class Time {
  private readonly seconds: Seconds;

  constructor(seconds: Seconds = 0) {
    this.seconds = seconds;
  }

  fromMinutes(minutes: number): Time {
    return new Time(minutes * SECONDS_PER_MINUTE);
  }

  static fromMicroseconds(microseconds: number): Time {
    return new Time(microseconds / MICROSECONDS_PER_SECOND);
  }

  static fromSeconds(seconds: Seconds): Time {
    return new Time(seconds);
  }

  static fromMilliseconds(milliseconds: Milliseconds): Time {
    return new Time(milliseconds / MS_PER_SECOND);
  }

  static fromBeats(beats: Beats, bpm: BPM): Time {
    return new Time((beats * SECONDS_PER_MINUTE) / bpm);
  }

  toSeconds(): Seconds {
    return this.seconds;
  }

  toMilliseconds(): Milliseconds {
    return this.seconds * MS_PER_SECOND;
  }

  toMicroseconds(): number {
    return this.seconds * MICROSECONDS_PER_SECOND;
  }

  toBeats(bpm: BPM): Beats {
    return (this.seconds / SECONDS_PER_MINUTE) * bpm;
  }

  add(time: Time): Time {
    return new Time(this.seconds + time.toSeconds());
  }

  subtract(time: Time): Time {
    return new Time(this.seconds - time.toSeconds());
  }

  addSeconds(seconds: Seconds): Time {
    return new Time(this.seconds + seconds);
  }

  addMilliseconds(milliseconds: Milliseconds): Time {
    return this.add(Time.fromMilliseconds(milliseconds));
  }

  addBeats(beats: Beats, bpm: BPM): Time {
    return this.add(Time.fromBeats(beats, bpm));
  }
}

export type NoteLength =
  | "whole"
  | "half"
  | "quarter"
  | "eighth"
  | "sixteenth"
  | "thirtySecond"
  | "sixtyFourth"
  | "dottedWhole"
  | "dottedHalf"
  | "dottedQuarter"
  | "dottedEighth"
  | "dottedSixteenth"
  | "tripletWhole"
  | "tripletHalf"
  | "tripletQuarter"
  | "tripletEighth"
  | "tripletSixteenth";

const NoteLengthToBeats: Record<NoteLength, Beats> = {
  whole: 4,
  half: 2,
  quarter: 1,
  eighth: 0.5,
  sixteenth: 0.25,
  thirtySecond: 0.125,
  sixtyFourth: 0.0625,
  dottedWhole: 6,
  dottedHalf: 3,
  dottedQuarter: 1.5,
  dottedEighth: 0.75,
  dottedSixteenth: 0.375,
  tripletWhole: 4 * (2 / 3),
  tripletHalf: 2 * (2 / 3),
  tripletQuarter: 1 * (2 / 3),
  tripletEighth: 0.5 * (2 / 3),
  tripletSixteenth: 0.25 * (2 / 3),
};

export class TimeDivision {
  private bpm: BPM;
  private timeSignature: TimeSignature;

  constructor(bpm: BPM, timeSignature: TimeSignature = [4, 4]) {
    this.bpm = bpm;
    this.timeSignature = timeSignature;
  }

  setBPM(bpm: BPM): void {
    this.bpm = bpm;
  }

  setTimeSignature(timeSignature: TimeSignature): void {
    this.timeSignature = timeSignature;
  }

  beatsToSeconds(beats: Beats): Seconds {
    return (beats * SECONDS_PER_MINUTE) / this.bpm;
  }

  secondsToBeats(seconds: Seconds): Beats {
    return (seconds / SECONDS_PER_MINUTE) * this.bpm;
  }

  getMeasureDurationInSeconds(): Seconds {
    return this.beatsToSeconds(this.timeSignature[0]);
  }

  getNoteLengthInMilliseconds(noteLength: NoteLength): Milliseconds {
    const beats = NoteLengthToBeats[noteLength];
    const seconds = this.beatsToSeconds(beats);
    return seconds * MS_PER_SECOND;
  }

  getNoteLengthInSeconds(noteLength: NoteLength): Seconds {
    const beats = NoteLengthToBeats[noteLength];
    return this.beatsToSeconds(beats);
  }

  getNoteLengthInBeats(noteLength: NoteLength): Beats {
    return NoteLengthToBeats[noteLength];
  }
}
