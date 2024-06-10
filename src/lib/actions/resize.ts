type ResizeHandlers = {
  handleSelector?: string;
  onResizeStart?: () => void;
  onResize?: (newWidth: number) => void;
  onResizeEnd?: () => void;
};

export function resize(
  node: HTMLElement,
  { handleSelector, onResizeStart, onResize, onResizeEnd }: ResizeHandlers,
): { destroy: () => void } {
  let startX: number;
  let startWidth: number;
  let isResizing = false;

  function handleMouseDown(event: MouseEvent) {
    const handle = handleSelector ? (node.querySelector(handleSelector) as HTMLElement) : node;

    // Check if we moused-down on the handle selector, if one is specified.
    if (handleSelector && handle && event.target !== handle) return;

    event.preventDefault();
    startX = event.clientX;
    startWidth = node.offsetWidth;
    isResizing = true;

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    if (onResizeStart) {
      onResizeStart();
    }
  }

  function handleMouseMove(event: MouseEvent) {
    if (!isResizing) return;

    const deltaX = event.clientX - startX;
    const newWidth = startWidth + deltaX;

    if (onResize) {
      onResize(newWidth);
    }
  }

  function handleMouseUp(event: MouseEvent) {
    if (!isResizing) return;
    isResizing = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);

    if (onResizeEnd) {
      onResizeEnd();
    }
  }

  node.addEventListener("mousedown", handleMouseDown);

  return {
    destroy() {
      node.removeEventListener("mousedown", handleMouseDown);
    },
  };
}
