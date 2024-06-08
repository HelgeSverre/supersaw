<script>
  export let value = 35;
  export let max = 100;
  export let min = 0;
  export let step = 1;

  function onInput(event) {
    volume = event.target.value;
  }
</script>

<div class="inline-block h-full w-4 bg-black p-0.5">
  <div class="relative h-full w-full cursor-pointer bg-white/10">
    <span class="block py-1 text-center text-[6px] leading-none">{value}</span>
    <div
      style="height: {value}%"
      class="absolute inset-x-0 bottom-0 border-t-4 border-accent-blue bg-accent-blue/50 hover:bg-accent-blue/60"
    ></div>
  </div>
</div>
