<script>
  export let text = "";
  export let additionalClasses = ""; // Additional CSS classes
</script>

<span
  class={`inline-flex h-10 items-center justify-center rounded bg-dark-400 px-3 text-sm font-bold text-light ${additionalClasses}`}
>
  {text}
</span>
