import type { Instrument } from "../core/types";
import { frequencyToMidiNote } from "../core/midi";

export class MidiOut implements Instrument {
  private output: MIDIOutput;
  private channel: number;

  constructor(output: MIDIOutput, channel: number = 1) {
    this.output = output;
    this.channel = channel;
  }

  startNote(frequency: number) {
    this.output.send([0x90 + (this.channel - 1), frequencyToMidiNote(frequency), 0x7f]);
  }

  stopNote(frequency: number) {
    this.output.send([0x80 + (this.channel - 1), frequencyToMidiNote(frequency), 0x40]);
  }

  playNote(frequency: number, time: number, duration: number) {
    // 0x90 - Note On
    // [number] - Midi note number (0-127)
    // 0x7f - Velocity
    this.output.send([0x90 + (this.channel - 1), frequencyToMidiNote(frequency), 0x7f], performance.now() + time);
    console.log("Sending NoteOn: " + frequencyToMidiNote(frequency) + " at time: ", time);

    // 0x80 - Note Off
    // [number] - Midi note number (0-127)
    // 0x40 - Velocity (ignored)
    this.output.send(
      [0x80 + (this.channel - 1), frequencyToMidiNote(frequency), 0x40],
      performance.now() + time + duration,
    );
    console.log("Sending NoteOff: " + frequencyToMidiNote(frequency), "at time: ", time + duration);
  }

  // Send all notes off command
  stop() {
    // TODO: this does not work, and i dont know why
    // See: https://www.recordingblogs.com/wiki/midi-controller-message
    // 0xb0 - Control Change
    // 0x7b - All Notes Off
    // 0x00 - Value (ignored)
    this.output.send([0xb0 + this.channel, 0x7b, 0x00], performance.now());
    this.output.close();

    console.log("Sending All Notes Off");
  }
}
