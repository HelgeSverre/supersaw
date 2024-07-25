<script>
  export let label = "Panel";
</script>

<fieldset {...$$restProps}>
  <legend
    class="panel-legend relative inline-flex h-5 w-full flex-row items-end justify-stretch gap-0 overflow-hidden p-0"
  >
    <span class="panel-label block h-full border-l-8 border-t-2 px-2 py-0.5">{label}</span>
    <div class="relative flex h-full w-[14px] flex-grow-0 overflow-hidden">
      <div class="absolute inset-0 flex aspect-square h-full w-full origin-top-left rotate-[40deg]">
        <div class="panel-accent w-60 border-t-2"></div>
      </div>
    </div>
    <div class="panel-accent-line h-2 w-full flex-1 border-t-2"></div>
  </legend>
  <div
    class="panel-content rounded-b-sm rounded-tr-sm border-l-8 border-[#6583C5] bg-[#2C2C37] p-2 text-sm leading-tight"
  >
    <slot></slot>
  </div>
</fieldset>

<style>
  fieldset {
    --background-color: #1c1714;
    --border-color: #798798;

    display: flex;
    flex-direction: column;
    align-items: start;
  }

  .panel-legend {
    font-family: "HandelGothic BT", "HandelGothic", sans-serif;
    font-size: 10px;
    font-weight: bold;
    border-top-color: var(--border-color);
    border-left-color: var(--border-color);
  }

  .panel-label {
    border-color: var(--border-color);
    background-color: var(--background-color);
  }

  .panel-content {
    flex: 1;
    width: 100%;
  }

  .panel-accent-line,
  .panel-accent,
  .panel-content {
    border-color: var(--border-color);
    background-color: var(--background-color);
  }
</style>
