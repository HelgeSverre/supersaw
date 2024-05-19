<script>
  export let onClick = () => {};
  export let icon;
  export let iconSize = 18;
  export let additionalClasses = "";
</script>

<button
  on:click={onClick}
  class={`inline-flex size-10 items-center justify-center rounded bg-dark-400 leading-none text-light hover:bg-dark-200 ${additionalClasses}`}
>
  {#if icon}
    <svelte:component this={icon} size={iconSize} />
  {/if}
</button>
