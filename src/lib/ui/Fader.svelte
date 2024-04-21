<script>
  export let volume = 0.5;
  export let max = 1;
  export let min = 0;
  export let step = 0.01;

  function onInput(event) {
    volume = event.target.value;
  }
</script>

<div class="relative flex items-center justify-center rounded-md bg-white/10 px-2 py-1">
  <input
    type="range"
    min={min}
    max={max}
    step={step}
    value={volume}
    on:input={onInput}
    class="vertical-slider cursor-pointer appearance-none rounded-full bg-gray-300"
  />
</div>

<style>
  .vertical-slider {
    writing-mode: bt-lr; /* IE */
    -webkit-appearance: slider-vertical; /* WebKit */
    width: 8px;
    height: 100px;
  }

  .vertical-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
  }

  .vertical-slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
  }
</style>
