<script>
  import { writable } from "svelte/store";
  import { onMount } from "svelte";

  let automationClip;

  let automationPoints = writable([
    { id: 1, x: 50, y: 50 },
    { id: 2, x: 150, y: 100 },
    { id: 3, x: 250, y: 150 },
  ]);

  onMount(() => {
    automationClip.addEventListener("mousemove", (event) => {
      if (isDragging) {
        updatePointPosition(selectedPoint, event.offsetX, event.offsetY);
      }
    });
  });

  let selectedPoint = null;
  let isDragging = false;

  function addPoint(event) {
    if (isDragging) return;

    console.log(event);
    console.log(isDragging);

    const rect = event.target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    automationPoints.update((points) => {
      points.push({ x, y });
      return points;
    });
  }

  function selectPoint(point) {
    selectedPoint = point.id;
  }

  function deleteSelectedPoint() {
    if (selectedPoint) {
      automationPoints.update((points) => {
        return points.filter((p) => p.id !== selectedPoint);
      });
      selectedPoint = null;
    }
  }

  function updatePointPosition(pointId, x, y) {
    automationPoints.update((points) => {
      const updatedPoints = points.map((p) => {
        if (p.id === pointId) {
          return { id: p.id, x, y };
        }
        return p;
      });
      return updatedPoints;
    });
  }
</script>

<div
  bind:this={automationClip}
  class="automation-clip absolute inset-0 w-full bg-black/50"
  aria-hidden="true"
  on:mouseup|stopPropagation={(event) => {
    event.stopPropagation();
    // TODO: bug must be done correctly
    if (isDragging) {
      setTimeout(() => {
        isDragging = false;
      }, 1);
    }

    if (selectedPoint) {
      selectedPoint = null;
    }
  }}
  on:click={addPoint}
>
  <svg>
    <!-- Line -->
    <path class="line" d={`M ${$automationPoints.map((p) => `${p.x},${p.y}`).join(" L ")}`} />

    <!-- Points -->
    {#each $automationPoints as point}
      <rect
        aria-hidden="true"
        class="point"
        class:selected={selectedPoint === point.id}
        on:mousedown|stopPropagation={() => {
          if (!isDragging) {
            selectPoint(point);
            isDragging = true;
          }
        }}
        x={point.x - 5}
        y={point.y - 5}
        width="10"
        height="10"
        stroke-width="2"
      />
    {/each}
  </svg>
</div>

<style>
  .automation-clip {
    border: 1px solid #ccc;
  }

  svg {
    width: 100%;
    height: 100%;
  }

  .line {
    fill: none;
    stroke: rgba(255, 255, 255, 0.8);
    stroke-width: 3;
  }

  .point {
    cursor: pointer;
    stroke: white;
  }

  .point.selected {
    fill: white;
  }
</style>
