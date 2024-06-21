<script>
  export let volume = 0.5;
  export let max = 1;
  export let min = 0;
  export let step = 0.01;

  function onInput(event) {
    volume = event.target.value;
  }
</script>

<div class="relative flex items-center justify-center rounded-md px-2 py-1">
  <input
    type="range"
    min={min}
    max={max}
    step={step}
    value={volume}
    on:input={onInput}
    class="vertical-slider cursor-pointer appearance-none rounded-full bg-black"
  />
</div>

<style>
  .vertical-slider {
    writing-mode: vertical-lr;
    direction: rtl;
    width: 20px;
    height: 100px;
    border-radius: 0;
  }

  .vertical-slider::-webkit-slider-runnable-track {
    background: transparent;
  }

  .vertical-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 6px;
    border-radius: 0;
    background: rgb(var(--accent-blue));
    cursor: pointer;
  }
</style>
