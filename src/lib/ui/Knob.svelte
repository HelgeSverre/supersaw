<script>
  import { createEventDispatcher } from "svelte";

  export let size = 64;
  export let value;
  export let min = 0;
  export let max = 127;
  export let step = 1;

  const dispatch = createEventDispatcher();
  let knob;

  const startAngle = -135;
  const endAngle = 135;

  function calculateRotation(value) {
    return ((value - min) / (max - min)) * (endAngle - startAngle) + startAngle;
  }

  function rotationToValue(rotation) {
    return Math.max(min, Math.min(max, ((rotation - startAngle) / (endAngle - startAngle)) * (max - min) + min));
  }

  function getAngle(event, centerX, centerY) {
    const dx = event.clientX - centerX;
    const dy = event.clientY - centerY;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  }

  function startDrag(event) {
    event.preventDefault();

    const rect = knob.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const initialAngle = getAngle(event, centerX, centerY) - rotation;

    function onMouseMove(moveEvent) {
      const angle = getAngle(moveEvent, centerX, centerY);
      const newRotation = Math.max(startAngle, Math.min(endAngle, angle - initialAngle));
      value = rotationToValue(newRotation);
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
  <div class="label">{min}</div>
  <div class="label">{value}</div>
  <div class="label">{max}</div>
  <div class="label">{step}</div>
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
