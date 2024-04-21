<script>
  export let onClick = () => {};
  export let additionalClasses = "";
  export let text;
</script>

<button
  on:click={onClick}
  class={`inline-flex h-10 items-center justify-center rounded bg-dark-400 px-3 text-sm font-normal leading-none text-light hover:bg-dark-200 ${additionalClasses}`}>
  {text}
</button>
