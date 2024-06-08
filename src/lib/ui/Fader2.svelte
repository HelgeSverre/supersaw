<script>
  export let value = 35;
  export let max = 100;
  export let min = 0;
  export let step = 1;
  let fader;
  let isDragging = false;

  function updateValue(clientY) {
    const rect = fader.getBoundingClientRect();
    const height = rect.height;
    const yOffset = rect.bottom - clientY;
    let newValue = Math.round(((yOffset / height) * (max - min)) / step) * step + min;
    if (newValue < min) newValue = min;
    if (newValue > max) newValue = max;
    value = newValue;
  }

  function onMouseDown(event) {
    event.preventDefault();
    isDragging = true;
    updateValue(event.clientY);
  }

  function onMouseMove(event) {
    if (isDragging) {
      event.preventDefault();
      updateValue(event.clientY);
    }
  }

  function onMouseUp() {
    isDragging = false;
  }

  function onMouseLeave() {
    isDragging = false;
  }

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
  window.addEventListener("mouseleave", onMouseLeave);
</script>

<div class="inline-block h-full w-6 bg-dark-800 p-0.5">
  <div
    class="relative h-full w-full cursor-pointer bg-white/10"
    aria-hidden="true"
    bind:this={fader}
    on:mousedown={onMouseDown}
  >
    <span class="block select-none py-1 text-center text-xs leading-none">{value}</span>
    <div
      style="height: {value}%"
      class="absolute inset-x-0 bottom-0 border-t-4 border-accent-blue bg-accent-blue/50 hover:bg-accent-blue/60"
    ></div>
  </div>
</div>
