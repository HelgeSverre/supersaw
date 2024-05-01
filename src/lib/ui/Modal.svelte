<script>
  import { X } from "lucide-svelte";

  export let dialog;

  export let dismissable = true;

  function onClose() {
    dialog.close();
  }
</script>

<dialog class="modal w-full max-w-4xl bg-dark-600" bind:this={dialog} on:close on:click|stopPropagation>
  <div class="modal__header flex flex-row items-center justify-between gap-6">
    <div class="flex-1">
      <slot name="header" />
    </div>
    {#if dismissable}
      <div class="modal__header-actions shrink-0">
        <button on:click={onClose} class="p-1">
          <X size="16" />
        </button>
      </div>
    {/if}
  </div>
  <div class="modal__body">
    <slot />
  </div>
</dialog>

<style>
  .modal::backdrop {
    background-color: rgba(0, 0, 0, 0.5);
  }

  .modal {
    z-index: 1000;
    border-radius: 8px;
    border: 1px solid var(--dark-200);
    color: var(--dark-600);
  }

  .modal__header {
    border-bottom: 1px solid var(--dark-200);
    background: var(--dark-400);
    color: var(--text-secondary);
    padding: 6px 10px;
    display: flex;
  }

  .modal__body {
    padding: 10px;
  }
</style>
