<script>
  import { onMount } from "svelte";
  import LED from "../../ui/LED.svelte";

  export let size = 16;

  let grid = [];

  onMount(() => {
    grid = Array(size)
      .fill()
      .map(() => Array(size).fill(0));
  });
</script>

<div style="--size: {size}">
  <div class="tenori-frame">
    <div class="tenori">
      <div class="tenori-grid">
        {#each grid as rows}
          {#each rows as cell}
            <div class="tenori-cell">
              <button class=" flex h-full w-full items-center justify-center" on:click={() => (cell = !cell)}>
                <LED on={cell} size="25" color="white" offColor="black" />
              </button>
            </div>
          {/each}
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  .tenori-frame {
    border: 10px solid silver;
    border-radius: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .tenori-grid {
    border-radius: 20px;
    padding: 10px;
    overflow: hidden;
    display: grid;
    background-color: rgba(0, 0, 0, 0.55);
    grid-template-rows: repeat(var(--size), 1fr);
    grid-template-columns: repeat(var(--size), 1fr);
    gap: 3px;
  }

  .tenori-cell {
    display: flex;
    align-items: center;
    justify-self: center;
    height: 40px;
    width: 40px;
  }
</style>
