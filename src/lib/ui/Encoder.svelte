<script>
  import { createEventDispatcher } from "svelte";
  import { tweened } from "svelte/motion";
  import { quartInOut } from "svelte/easing";

  export let size = 64;
  export let value = 0;
  export let min = 0;
  export let max = 127;
  export let step = 1;

  // Amount of PX the mouse has to move to change the value from min to max
  export let sensitivity = 100;

  // Amount of PX the mouse has to move to change the value from min to max when shift is pressed (fine-tune)
  export let fineTuneSensitivity = 500;

  const dispatch = createEventDispatcher();

  let knob;
  let startY;
  let lastY;
  let startValue;

  let fineTune = false;
  let strokeWidth = tweened(8, {
    duration: 100,
    easing: quartInOut,
  });

  function calculateFactor(baseDistance) {
    return (max - min) / baseDistance;
  }

  function calculateRotation(value) {
    return ((value - min) / (max - min)) * 270 - 135;
  }

  function rotationToValue(distance, baseDistance) {
    const factor = calculateFactor(baseDistance);
    const rawValue = startValue - distance * factor;
    return Math.max(min, Math.min(max, rawValue));
  }

  function startDrag(event) {
    event.preventDefault();
    startY = event.clientY;
    lastY = startY;
    startValue = value;
    fineTune = event.shiftKey;
    strokeWidth.set(fineTune ? 4 : 8);

    function onMouseMove(moveEvent) {
      lastY = moveEvent.clientY;

      const distance = lastY - startY;
      let newValue = rotationToValue(distance, fineTune ? fineTuneSensitivity : sensitivity);
      if (step !== null) {
        newValue = Math.round(newValue / step) * step;
      }
      value = newValue;
      dispatch("input", { value });
    }

    function onKeyDown(event) {
      if (event.key === "Shift") {
        startY = lastY;
        startValue = value;
        fineTune = true;
        strokeWidth.set(4);
      }
    }

    function onKeyUp(event) {
      if (event.key === "Shift") {
        startY = lastY;
        startValue = value;
        fineTune = false;
        strokeWidth.set(8);
      }
    }

    function onMouseUp() {
      fineTune = false;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);

      dispatch("change", { value });
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  function onWheel(event) {
    event.preventDefault();
    event.stopPropagation();

    const factor = calculateFactor(event.shiftKey ? fineTuneSensitivity : sensitivity);
    const newValue = value + event.deltaY * factor;
    value = Math.max(min, Math.min(max, newValue));
    dispatch("input", { value });
  }

  function onKeyDown(event) {
    event.stopPropagation();

    // Assume the knob is focused, if it takes 100 px to go from min to max
    // it should take 10 "steps" to go from min to max with key presses
    const arrowKeySensitivity = event.shiftKey ? fineTuneSensitivity / 10 : sensitivity / 10;
    const factor = calculateFactor(arrowKeySensitivity);

    if (event.key === "ArrowUp" || event.key === "ArrowRight") {
      value = Math.min(max, value + step * factor);
      dispatch("input", { value });
    }

    if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
      value = Math.min(max, value - step * factor);
      dispatch("input", { value });
    }
  }

  $: rotation = calculateRotation(value);
</script>

<div
  class="knob"
  style="--size: {size}px"
  on:mousedown={startDrag}
  on:keydown={onKeyDown}
  on:wheel={onWheel}
  bind:this={knob}
  role="slider"
  tabindex="0"
  aria-valuemin={min}
  aria-valuemax={max}
  aria-valuenow={value}
>
  <svg viewBox="0 0 100 100">
    <!-- Chrome-style knob with highlights -->
    <circle
      transform="rotate({rotation} 50 50)"
      cx="50"
      cy="50"
      r="45"
      fill="url(#metal)"
      stroke="#cecece"
      stroke-width="1"
    />
    <circle transform="rotate({rotation} 50 50)" cx="50" cy="50" r="40" fill="url(#shine)" />
    <line
      class="needle"
      x1="50"
      y1="50"
      x2="50"
      y2="15"
      stroke="black"
      opacity="0.1"
      stroke-width="4"
      stroke-linecap="round"
      transform="rotate({rotation} 50 50)"
    />
    <defs>
      <linearGradient id="metal" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#E9EBEC;stop-opacity:0.5" />
        <stop offset="100%" style="stop-color:#9A9494;stop-opacity:0.7" />
      </linearGradient>
      <radialGradient id="shine" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
        <stop offset="0%" style="stop-color:#d8d8d8;stop-opacity:0.5" />
        <stop offset="100%" style="stop-color:#7A787D;stop-opacity:0.5" />
      </radialGradient>
    </defs>
  </svg>
</div>

<style>
  .knob {
    position: relative;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    user-select: none;
    width: var(--size);
    height: var(--size);
  }

  .knob:focus-visible {
    outline: none;
    background-color: rgba(255, 255, 255, 0.05);
  }

  svg {
    width: var(--size);
    height: var(--size);
  }
</style>
