<script>
  import classNames from "classnames";

  export let text = "";
  export let additionalClasses = ""; // Additional CSS classes
</script>

<span
  class={classNames(
    "inline-flex h-10 items-center justify-center rounded bg-dark-400 px-3 font-mono text-sm font-normal leading-none text-light",
    additionalClasses,
  )}
>
  {text}
</span>

<style>
  span {
    background-color: var(--control-background);
    color: var(--control-foreground);
  }
</style>
