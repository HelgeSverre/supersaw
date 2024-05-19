<script>
  import { createEventDispatcher } from "svelte";

  export let size = 100;
  export let minValue = 0;
  export let maxValue = 127;
  export let value = 20;

  const dispatch = createEventDispatcher();
  let knob;

  const startAngle = -135; // Start angle of the arc (in degrees)
  const endAngle = 135; // End angle of the arc (in degrees)
  let rotation = calculateRotation(value);

  function calculateRotation(value) {
    const valueRatio = (value - minValue) / (maxValue - minValue);
    return valueRatio * (endAngle - startAngle) + startAngle;
  }

  function startDrag(event) {
    event.preventDefault();

    const rect = knob.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let initialAngle = getAngle(event, centerX, centerY) - rotation;

    function onMouseMove(moveEvent) {
      let angle = getAngle(moveEvent, centerX, centerY);
      let newRotation = angle - initialAngle;

      // Ensure newRotation stays within arc bounds
      newRotation = Math.max(startAngle, Math.min(endAngle, newRotation));
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

  function rotationToValue(rotation) {
    let newValue = ((rotation - startAngle) / (endAngle - startAngle)) * (maxValue - minValue) + minValue;
    return Math.max(minValue, Math.min(maxValue, newValue));
  }

  function getAngle(event, centerX, centerY) {
    const dx = event.clientX - centerX;
    const dy = event.clientY - centerY;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  }

  $: rotation = calculateRotation(value);
</script>

<div
  class="knob-container"
  style="--size: {size}px"
  on:mousedown={startDrag}
  bind:this={knob}
  aria-valuemin={minValue}
  aria-valuemax={maxValue}
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
  <div class="label">{value.toFixed(0)}</div>
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
