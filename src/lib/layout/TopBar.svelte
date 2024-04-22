<script>
  const appName = import.meta.env.VITE_APP_NAME;
  const appVersion = import.meta.env.VITE_APP_VERSION;
</script>

<div>
  <div
    class="flex h-full w-full items-center justify-between border-b-2 border-dark-900 bg-dark-300 bg-gradient-to-t from-dark-400 via-dark-300 to-dark-300 px-2 py-2"
  >
    <div class="text-xs font-medium leading-none text-white/40">{appName}</div>
    <div class="text-xs font-medium leading-none text-white/40">{appVersion}</div>
  </div>
</div>
