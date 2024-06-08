<script>
  import { createEventDispatcher } from "svelte";

  export let value = "";
  export let options = [];
  export let placeholder = "";

  const dispatch = createEventDispatcher();

  function handleChange(event) {
    dispatch("change", event.target.value);
  }
</script>

<select
  bind:value={value}
  on:change={handleChange}
  type="text"
  class="h-10 w-full appearance-none rounded border-r-8 border-transparent bg-dark-400 px-2 text-sm font-normal placeholder-light-soft/50 focus:border-transparent focus:outline-none focus:ring-0 focus:ring-transparent"
>
  {#if placeholder}
    <option value="" disabled selected>{placeholder}</option>
  {/if}

  {#each options as option}
    <option value={option.value}>{option.label}</option>
  {/each}
</select>
