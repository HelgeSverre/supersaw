<script>
  export let value = "";
  export let placeholder = "";
</script>

<input
  bind:value={value}
  placeholder={placeholder}
  type="text"
  class="h-10 w-full rounded bg-dark-400 px-2 text-sm font-normal placeholder-light-secondary/50 focus:border-transparent focus:outline-none focus:ring-0 focus:ring-transparent"
/>
