<script>
  import { Search } from "lucide-svelte";

  export let value = "";
  export let placeholder = "Search...";
</script>

<div class="relative h-fit w-full rounded bg-dark-400">
  <div class="absolute inset-y-0 left-2 flex items-center justify-center">
    <Search size="16" class="text-light-soft" />
  </div>

  <input
    bind:value={value}
    placeholder={placeholder}
    type="search"
    class="h-10 w-full text-ellipsis bg-transparent pl-8 text-sm font-normal placeholder-light-soft/50 focus:border-transparent focus:outline-none focus:ring-0 focus:ring-transparent"
  />
</div>
