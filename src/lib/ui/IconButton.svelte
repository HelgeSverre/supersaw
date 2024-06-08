<script>
  import classNames from "classnames";

  export let onClick = () => {};
  export let icon;
  export let iconSize = 18;
  export let additionalClasses = "";
</script>

<button
  on:click={onClick}
  class={classNames(
    "inline-flex size-10 items-center justify-center rounded  leading-none text-light",
    " focus:outline-none focus:ring-1 focus:ring-dark-100",
    additionalClasses,
  )}
>
  {#if icon}
    <svelte:component this={icon} size={iconSize} />
  {/if}
</button>

<style>
  button {
    background-color: var(--control-background);
    color: var(--control-foreground);
  }
</style>
