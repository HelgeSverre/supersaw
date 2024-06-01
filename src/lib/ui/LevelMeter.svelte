<script>
  export let level = 0;
</script>

<div class="flex w-1.5 flex-1 flex-row">
  <div class="relative w-full bg-gradient-to-t from-green-600 via-yellow-600 to-red-700">
    <div
      class="absolute inset-x-0 top-0 border-b border-red-700 bg-[#4D4D4D]"
      style={`min-height: ${100 - level}%`}
    ></div>
  </div>
</div>
