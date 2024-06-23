<script>
  import classNames from "classnames";
  import { createEventDispatcher } from "svelte";

  export let onClick = () => {};
  export let icon;
  export let iconSize = 18;
  export let additionalClasses = "";

  const dispatch = createEventDispatcher();

  function handleClick(event) {
    onClick(event);
    dispatch("click", event);
  }
</script>

<button
  on:click={handleClick}
  class={classNames(
    "inline-flex size-10 items-center justify-center rounded bg-dark-400 leading-none text-light",
    "hover:bg-dark-200 focus:outline-none focus:ring-1 focus:ring-dark-100",
    additionalClasses,
  )}
>
  {#if icon}
    <svelte:component this={icon} size={iconSize} />
  {/if}
</button>
