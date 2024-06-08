import { writable } from "svelte/store";

export const currentTheme = writable("ableton");
export const availableThemes = writable(["ableton", "ableton-light", "reaper", "material"]);

export function changeTheme(theme) {
  currentTheme.set(theme);
}
