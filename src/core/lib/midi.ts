export interface MidiReceiver {
  onMidiEvent(event: Uint8Array): void;
}

export class MidiEventLogger implements MidiReceiver {
  onMidiEvent(event: Uint8Array): void {
    console.log("LoggingMidiEventReceiver received Midi event:", event);
  }
}

export class MidiSystem {
  private MidiAccess: MIDIAccess | null = null;
  private MidiOutPorts: MIDIOutput[] = [];
  private receivers: MidiReceiver[] = [];

  async initialize(): Promise<void> {
    if (!navigator.requestMIDIAccess()) {
      throw new Error("Midi is not supported in this browser.");
    }

    this.MidiAccess = await navigator.requestMIDIAccess();
    this.MidiAccess.inputs.forEach((input) => {
      input.onmidimessage = this.handleMidiMessage.bind(this);
    });

    this.MidiAccess.outputs.forEach((output) => {
      this.MidiOutPorts.push(output);
    });
  }

  addReceiver(receiver: MidiReceiver): void {
    this.receivers.push(receiver);
  }

  removeReceiver(receiver: MidiReceiver): void {
    this.receivers = this.receivers.filter((r) => r !== receiver);
  }

  sendMidiMessage(message: Uint8Array, portIndex: number): void {
    if (this.MidiOutPorts[portIndex]) {
      this.MidiOutPorts[portIndex].send(message);
    }
  }

  private handleMidiMessage(event: MIDIMessageEvent): void {
    this.receivers.forEach((receiver) => {
      receiver.onMidiEvent(event.data);
    });
  }
}

export class MidiNote {
  name: string;
  label: string;
  octave: number;
  midiNumber: number;
  pitch: number;

  private static noteNames: string[] = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

  private constructor(name: string, label: string, octave: number, midiNumber: number) {
    this.name = name;
    this.label = label;
    this.octave = octave;
    this.midiNumber = midiNumber;
  }

  public pitchHz(): number {
    if (this.midiNumber === 0) return 0;

    return 440 * Math.pow(2, (this.midiNumber - 69) / 12);
  }

  static fromPitchHz(hz: number): MidiNote {
    const midiNumber = 69 + 12 * Math.log2(hz / 440);
    const noteName = this.noteNames[Math.round(midiNumber) % 12];
    const octave = Math.floor(midiNumber / 12) - 1;
    return new MidiNote(noteName, `${noteName}${octave}`, octave, Math.round(midiNumber));
  }

  static fromNumber(number: number): MidiNote {
    const noteName = this.noteNames[number % 12];
    const octave = Math.floor(number / 12) - 1;
    return new MidiNote(noteName, `${noteName}${octave}`, octave, number);
  }

  static fromLabel(label: string): MidiNote {
    const match = label.match(/([A-G]#?)(-?\d+)/);
    if (!match) {
      throw new Error("Invalid note label");
    }
    const noteName = match[1];
    const octave = parseInt(match[2], 10);
    const number = this.noteNames.indexOf(noteName) + (octave + 1) * 12;
    return new MidiNote(noteName, label, number, octave);
  }

  toString(): string {
    return `${this.label}${this.octave}`;
  }
}
