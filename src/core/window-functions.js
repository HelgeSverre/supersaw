export class WindowFunctions {
  static run(type, size) {
    switch (type) {
      case "hann":
        return WindowFunctions.hann(size);
      case "hamming":
        return WindowFunctions.hamming(size);
      case "blackman":
        return WindowFunctions.blackman(size);
      case "helge":
        return WindowFunctions.helge(size);
      default:
        return WindowFunctions.hann(size); // Default window if no type matched
    }
  }

  static hann(size) {
    const window = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)));
    }
    return window;
  }

  static hamming(size) {
    const window = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      window[i] = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (size - 1));
    }
    return window;
  }

  static blackman(size) {
    const window = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      window[i] =
        0.42 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1)) + 0.08 * Math.cos((4 * Math.PI * i) / (size - 1));
    }
    return window;
  }

  // Random algo I stole from inside the blackman window
  static helge(size) {
    const window = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      window[i] = (2 * Math.PI * i) / (size - 1);
    }
    return window;
  }
}
