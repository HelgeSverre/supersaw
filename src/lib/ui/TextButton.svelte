<script>
  import { createEventDispatcher } from "svelte";
  import classNames from "classnames";

  export let onClick = () => {};
  export let additionalClasses = "";
  export let text = null;

  const dispatch = createEventDispatcher();

  function handleClick(event) {
    onClick(event);
    dispatch("click", event);
  }
</script>

<button
  on:click={handleClick}
  class={classNames(
    "inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded bg-dark-400 px-3 text-sm font-normal leading-none text-light",
    "hover:bg-dark-200 focus:outline-none focus:ring-1 focus:ring-dark-100",
    additionalClasses,
  )}
>
  <slot>
    {text}
  </slot>
</button>
