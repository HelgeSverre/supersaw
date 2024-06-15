import { writable } from "svelte/store";

export interface DemoMidiFile {
  label: string;
  file: string;
}

export const demoMidiFiles = writable<DemoMidiFile[]>([
  { label: "Ayla - Ayla (Veracocha Remix)", file: "/midi/ayla.mid" },
  { label: "A-Lusion meets Scope DJ - Between Worlds", file: "/midi/between-worlds.mid" },
  { label: "Cosmic Gate - Come With Me", file: "/midi/come-with-me.mid" },
  { label: "Witness Of Wonder - Emotion In Motion (Thrillseekers Remix)", file: "/midi/emotions.mid" },
  { label: "Flutlicht - Icarus", file: "/midi/icarus.mid" },
  { label: "Abject - In Our Memories ", file: "/midi/in-our-memories.mid" },
  { label: "Dash Berlin - Man On The Run (intro)", file: "/midi/man-on-the-run.mid" },
  { label: "Dash Berlin - Man On The Run (full) ", file: "/midi/man-on-the-run-long.mid" },
  { label: "Nu NRG - Moon Loves The Sun", file: "/midi/moon-loves-the-sun.mid" },
  { label: "Nu NRG - Moon Loves The Sun (full)", file: "/midi/moon-loves-the-sun-full.mid" },
  { label: "System F - Out Of The Blue", file: "/midi/system-f-out-of-e-blue.midi" },
  { label: "William Orbit - Adagio For Strings", file: "/midi/orbit-adagio.mid" },
  { label: "B-Front & DV8 - We Will Never Break", file: "/midi/we-will-never-break-wish-outdoor.mid" },
]);
