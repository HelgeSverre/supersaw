import { BPM, Time, TimeDivision, TimeOffset } from "./time";
import { MidiEventLogger, MidiSystem } from "./midi";
import { createUUID } from "./utils";
import { AudioBuffer, Clip } from "./types";

class AudioClip implements Clip {
  id: string;
  buffer: AudioBuffer | null = null;
  startTime: TimeOffset;
  duration: TimeOffset;
  private source: AudioBufferSourceNode | null = null;
  private readonly output: GainNode;

  constructor(buffer: AudioBuffer, startTime: TimeOffset, duration: TimeOffset, output: GainNode) {
    this.id = createUUID("clip");
    this.buffer = buffer;
    this.startTime = startTime;
    this.duration = duration;
    this.output = output;
  }

  play(globalStartTime: TimeOffset, audioContext: AudioContext): void {
    this.source = audioContext.createBufferSource();
    // @ts-ignore
    this.source.buffer = this.buffer;
    this.source.connect(this.output);
    this.source.start(globalStartTime.add(this.startTime).toSeconds(), 0, this.duration.toSeconds());
  }

  stop(): void {
    if (this.source) {
      this.source.stop();
    }
  }
}

class Track {
  id: string;
  clips: Clip[] = [];
  private output: GainNode;
  private audioContext: AudioContext;

  constructor(audioContext: AudioContext) {
    this.id = createUUID("track");
    this.audioContext = audioContext;
    this.output = this.audioContext.createGain();
    this.output.connect(this.audioContext.destination);
  }

  addClip(clip: Clip): void {
    this.clips.push(clip);
  }

  play(startTime: TimeOffset): void {
    this.clips.forEach((clip) => clip.play(startTime, this.audioContext));
  }

  stop(): void {
    this.clips.forEach((clip) => clip.stop());
  }
}

class AudioChannel {
  id: string;
  tracks: Track[] = [];
  private audioContext: AudioContext;

  constructor(audioContext: AudioContext) {
    this.id = createUUID("channel");
    this.audioContext = audioContext;
  }

  createTrack(): Track {
    const track = new Track(this.audioContext);
    this.tracks.push(track);
    return track;
  }

  play(startTime: TimeOffset): void {
    this.tracks.forEach((track) => track.play(startTime));
  }

  stop(): void {
    this.tracks.forEach((track) => track.stop());
  }
}

class AudioEngine {
  audioContext: AudioContext;
  bpm: BPM;
  timeDivision: TimeDivision;
  channels: AudioChannel[] = [];
  private startTime: TimeOffset = new Time();
  private pausedTime: TimeOffset = new Time();
  private isPaused: boolean = false;
  midiSystem: MidiSystem;

  constructor(bpm: BPM = 120, timeSignature: [number, number] = [4, 4]) {
    // @ts-ignore
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.bpm = bpm;
    this.timeDivision = new TimeDivision(bpm, timeSignature);

    this.midiSystem = new MidiSystem();
    this.midiSystem.addReceiver(new MidiEventLogger());
  }

  createChannel(): AudioChannel {
    const channel = new AudioChannel(this.audioContext);
    this.channels.push(channel);
    return channel;
  }

  async start(): Promise<void> {
    if (this.isPaused) {
      const pauseDuration = this.now().subtract(this.startTime.add(this.pausedTime));
      this.pausedTime = this.pausedTime.add(pauseDuration);
      this.isPaused = false;
    } else {
      this.startTime = this.now();
    }
    await this.audioContext.resume();
    this.channels.forEach((channel) => channel.play(this.startTime));
  }

  async stop(): Promise<void> {
    await this.audioContext.suspend();
    this.channels.forEach((channel) => channel.stop());
  }

  public now(): TimeOffset {
    return new Time(this.audioContext.currentTime);
  }

  async pause(): Promise<void> {
    await this.audioContext.suspend();
    this.isPaused = true;
    this.pausedTime = this.pausedTime.add(this.now().subtract(this.startTime));
  }
}

export default AudioEngine;
