<script>
  export let additionalClasses = ""; // Additional CSS classes
</script>

<div class={`inline-flex flex-row gap-1 ${additionalClasses}`}>
  <slot />
</div>
