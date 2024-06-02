import type { Instrument } from "../core/types";
import { frequencyToMidiNote } from "../core/midi";

export class MidiOut implements Instrument {
  private output: MIDIOutput;

  constructor(output: MIDIOutput) {
    this.output = output;
  }

  startNote(frequency: number) {
    this.output.send([0x90, frequencyToMidiNote(frequency), 0x7f]);
  }

  stopNote(frequency: number) {
    this.output.send([0x80, frequencyToMidiNote(frequency), 0x40]);
  }

  playNote(frequency: number, time: number, duration: number) {
    // 0x90 - Note On
    // [number] - Midi note number (0-127)
    // 0x7f - Velocity
    this.output.send([0x90, frequencyToMidiNote(frequency), 0x7f], performance.now() + time);
    console.log("Sending NoteOn: " + frequencyToMidiNote(frequency) + " at time: ", time);

    // 0x80 - Note Off
    // [number] - Midi note number (0-127)
    // 0x40 - Velocity (ignored)
    this.output.send([0x80, frequencyToMidiNote(frequency), 0x40], performance.now() + time + duration);
    console.log("Sending NoteOff: " + frequencyToMidiNote(frequency), "at time: ", time + duration);
  }

  // Send all notes off command
  stop() {
    // See: https://www.recordingblogs.com/wiki/midi-controller-message
    // 0xb0 - Control Change
    // 0x7b - All Notes Off
    // 0x00 - Value (ignored)
    this.output.send([0xb0, 0x7b, 0x00]);
    this.output.close();

    console.log("Sending All Notes Off");
  }
}
