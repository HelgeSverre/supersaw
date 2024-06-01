<script>
  import classNames from "classnames";

  export let onClick = () => {};
  export let additionalClasses = "";
  export let text;
</script>

<button
  on:click={onClick}
  class={classNames(
    "inline-flex h-10 items-center justify-center whitespace-nowrap rounded bg-dark-400 px-3 text-sm font-normal leading-none text-light",
    "hover:bg-dark-200 focus:outline-none focus:ring-1 focus:ring-dark-100",
    additionalClasses,
  )}
>
  {text}
</button>
