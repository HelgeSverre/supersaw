import type { Action } from "svelte/action";

type DragHandlers = {
  onDragStart?: (startX: number, startY: number) => void;
  onDrag?: (details: { deltaX: number; deltaY: number; initialY: number; initialX: number }) => void;
  onDragEnd?: () => void;
};

export function drag(
  node: HTMLElement,
  { onDragStart, onDrag, onDragEnd }: DragHandlers,
): ReturnType<Action<HTMLElement, string>> {
  let initialX: number;
  let initialY: number;
  let lastX: number;
  let lastY: number;

  function handleMouseDown(event: MouseEvent) {
    event.preventDefault();

    initialX = event.clientX;
    lastX = event.clientX;

    initialY = event.clientY;
    lastY = event.clientY;

    const rect = node.getBoundingClientRect();

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    if (onDragStart) {
      onDragStart(lastX, lastY);
    }
  }

  function handleMouseMove(event: MouseEvent) {
    const deltaX = event.clientX - lastX;
    const deltaY = event.clientY - lastY;

    if (onDrag) {
      onDrag({
        deltaX,
        deltaY,
        initialX,
        initialY,
      });
    }

    lastX = event.clientX;
    lastY = event.clientY;
  }

  function handleMouseUp() {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);

    if (onDragEnd) {
      onDragEnd();
    }
  }

  node.addEventListener("mousedown", handleMouseDown);

  return {
    destroy() {
      node.removeEventListener("mousedown", handleMouseDown);
    },
  };
}
