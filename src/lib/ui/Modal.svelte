<script>
  import { X } from "lucide-svelte";
  import { onMount } from "svelte";

  export let dialog;

  export let dismissable = true;

  onMount(() => {
    dialog.showModal();
  });

  function onClose() {
    dialog.close();
  }
</script>

<dialog
  aria-hidden="true"
  class="modal w-full max-w-4xl rounded-xl border-2 border-dark-300 bg-dark-600"
  bind:this={dialog}
  on:close
  on:click|stopPropagation
>
  <div class="modal__header mb-2 flex flex-row items-center justify-between gap-6 border-b border-gray-400/10">
    <div class=" flex-1 font-mono text-sm text-gray-200">
      <slot name="header" />
    </div>
    {#if dismissable}
      <div class="modal__header-actions shrink-0">
        <button on:click={onClose} class="p-1 text-gray-400 hover:text-gray-200">
          <X size="16" />
        </button>
      </div>
    {/if}
  </div>
  <div class="modal__body text-white">
    <slot />
  </div>
</dialog>

<style>
  .modal::backdrop {
    background-color: rgba(0, 0, 0, 0.5);
  }

  .modal__header {
    padding: 6px 10px;
    display: flex;
  }

  .modal__body {
    padding: 0px 10px 10px;
  }
</style>
