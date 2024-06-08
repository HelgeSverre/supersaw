<script>
  export let size = 12;
  export let color = "#ff0000"; // Default LED color
</script>

<svg class="led" viewBox="0 0 100 100" style="--size: {size}px; --color: {color}">
  <circle cx="50" cy="50" r="30" fill="black" opacity="0.5" />
  <!-- LED base circle -->
  <circle cx="50" cy="50" r="40" fill={color} opacity="0.8" />

  <!-- LED highlights -->
  <ellipse cx="40" cy="40" rx="20" ry="10" fill="white" opacity="0.5" />
  <ellipse cx="60" cy="60" rx="10" ry="5" fill="white" opacity="0.3" />

  <!-- LED reflections -->
  <ellipse cx="30" cy="30" rx="15" ry="7.5" fill="white" opacity="0.2" />
  <ellipse cx="70" cy="70" rx="5" ry="2.5" fill="white" opacity="0.1" />

  <!-- LED bottom reflection -->
  <ellipse cx="50" cy="80" rx="20" ry="5" fill="white" opacity="0.1" />
</svg>

<style>
  svg.led {
    border-radius: 50%;
    overflow: hidden;
    width: var(--size);
    height: var(--size);
  }

  .led * {
    transition: fill 100ms ease-out;
  }
</style>
