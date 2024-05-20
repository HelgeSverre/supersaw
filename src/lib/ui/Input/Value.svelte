<script>
  export let value = "";
  export let label = "";
</script>

<div class="flex flex-col gap-1">
  {#if label}
    <label for="sustain" class="text-xs text-white/50">{label}</label>
  {/if}
  <input
    class="w-full rounded-sm border border-dark-200 bg-dark-700 p-0 text-center text-xs text-white"
    type="number"
    min="0.0"
    max="1"
    step="0.1"
    name="sustain"
    bind:value={value}
  />
</div>
