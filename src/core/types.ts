export interface Instrument {
  startNote: (frequency: number) => void;
  stopNote: (frequency: number) => void;
  playNote: (frequency: number, time: number, duration: number) => void;
  clearScheduledNotes: () => void;
  stop: () => void;
}

export interface ADSR {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export interface MidiNote {
  track: string;
  label: string;
  note: number;
  velocity: number;
  start: number;
  duration: number;
}

export interface AudioClip {
  id: string;
  type: "audio";
  name: string;
  audioUrl?: string;
  startTime: number;
  duration: number;
  audioBuffer?: AudioBuffer;
}

export interface MidiClip {
  id: string;
  type: "midi";
  name: string;
  startTime: number;
  duration: number;
  audioBuffer?: AudioBuffer;
  midiData?: import("midi-file").MidiData;
  notes?: MidiNote[];
}

type Clip = AudioClip | MidiClip;

export interface Track {
  id: string;
  name: string;
  type: "audio" | "instrument";
  instrument?: string;
  isMuted: boolean;
  isSolo: boolean;
  clips: Clip[];
}
