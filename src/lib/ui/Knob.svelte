<script>
  import { createEventDispatcher } from "svelte";

  export let size = 64;
  export let value;
  export let min = 0;
  export let max = 127;
  export let step = 1;

  const dispatch = createEventDispatcher();
  let knob;
  let startY;
  let startValue;

  // Define the base distance that represents the full range of the knob's values
  const baseDistance = 100; // Adjust this value to control the drag sensitivity

  function calculateFactor() {
    return (max - min) / baseDistance;
  }

  function calculateRotation(value) {
    return ((value - min) / (max - min)) * 270 - 135;
  }

  function rotationToValue(distance) {
    const factor = calculateFactor();
    const rawValue = startValue - distance * factor;
    return Math.max(min, Math.min(max, rawValue));
  }

  function startDrag(event) {
    event.preventDefault();
    startY = event.clientY;
    startValue = value;

    function onMouseMove(moveEvent) {
      const distance = moveEvent.clientY - startY;
      let newValue = rotationToValue(distance);
      if (step !== null) {
        newValue = Math.round(newValue / step) * step;
      }
      value = newValue;
      dispatch("input", { value });
    }

    function onMouseUp() {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      dispatch("change", { value });
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  $: rotation = calculateRotation(value);
</script>

<div
  class="knob-container"
  style="--size: {size}px"
  on:mousedown={startDrag}
  bind:this={knob}
  aria-valuemin={min}
  aria-valuemax={max}
  aria-valuenow={value}
>
  <svg class="knob-svg" viewBox="0 0 100 100">
    <!-- Background arc -->
    <path d="M 30 70 A 30 30 0 1 1 70 70" stroke="#5A5F63" stroke-linecap="round" stroke-width="8" fill="none" />
    <!-- Needle -->
    <line
      x1="50"
      y1="50"
      x2="50"
      y2="20"
      stroke="#ffffff"
      stroke-width="8"
      stroke-linecap="round"
      transform="rotate({rotation} 50 50)"
    />
  </svg>
  <div class="label">{min.toFixed(2)}</div>
  <div class="label">{value.toFixed(2)}</div>
  <div class="label">{max.toFixed(2)}</div>
</div>

<style>
  .knob-container {
    position: relative;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    user-select: none;
  }

  .knob-svg {
    width: var(--size);
    height: var(--size);
  }

  .label {
    display: inline-block;
    line-height: 1em;
    text-align: center;
    font-size: 14px;
    color: white;
  }
</style>
