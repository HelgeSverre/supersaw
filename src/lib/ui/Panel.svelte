<script>
</script>

<main>
  <div class=" panel">
    <p>This is a panel with secondary text color.</p>
    <button class="button-primary">Primary Button</button>
    <button class="button-primary" disabled>Disabled Button</button>
  </div>
</main>

<style>
  main {
    background-color: var(--background-main);
    padding: 20px;
  }

  .panel {
    background-color: var(--background-surface);
    border: 1px solid var(--border-main);
    color: var(--text-secondary);
    padding: 10px;
    margin-bottom: 10px;
  }

  .button-primary {
    background-color: var(--accent-primary);
    color: var(--text-primary);
    border: none;
    padding: 10px 20px;
    cursor: pointer;
  }

  .button-primary:hover {
    background-color: var(--element-hover);
  }

  .button-primary:disabled {
    background-color: var(--element-disabled);
    cursor: not-allowed;
  }
</style>
