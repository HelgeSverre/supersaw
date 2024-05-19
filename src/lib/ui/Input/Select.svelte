<script>
  export let value = "";
  export let options = [];
  export let placeholder = "";
</script>

<select
  bind:value={value}
  type="text"
  class="h-10 w-full rounded border-r-8 border-transparent bg-dark-400 px-2 text-sm font-normal placeholder-light-secondary/50 focus:border-transparent focus:outline-none focus:ring-0 focus:ring-transparent"
>
  {#if placeholder}
    <option value="" disabled selected>{placeholder}</option>
  {/if}

  {#each options as option}
    <option value={option.value}>{option.label}</option>
  {/each}
</select>
