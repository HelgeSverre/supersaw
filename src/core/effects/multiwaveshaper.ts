// Helper function to create and connect nodes
import { audioManager } from "../audio";

export function createEffect(curveFunction, amount) {
  const shaper = audioManager.audioContext.createWaveShaper();
  shaper.curve = curveFunction(amount);
  return shaper;
}

// 1. Soft Clipping (Saturation)
export function createSoftClippingCurve(amount) {
  const k = typeof amount === "number" ? amount : 50;
  return new Float32Array([-1, 0, 1].map((x) => Math.tanh(k * x) / Math.tanh(k)));
}

// 2. Hard Clipping
export function createHardClippingCurve(threshold) {
  return new Float32Array([-1, 0, 1].map((x) => Math.max(Math.min(x, threshold), -threshold)));
}

// 3. Bit Crushing
export function createBitCrushCurve(bits) {
  const steps = Math.pow(2, bits - 1);
  return new Float32Array([-1, 0, 1].map((x) => Math.round(x * steps) / steps));
}

// 4. Sine Shaping (Weird harmonics)
export function createSineShapingCurve(amount) {
  return new Float32Array([-1, 0, 1].map((x) => Math.sin(amount * x)));
}

// 5. Exponential Shaping
export function createExponentialCurve(exponent) {
  return new Float32Array([-1, 0, 1].map((x) => Math.sign(x) * Math.pow(Math.abs(x), exponent)));
}

// 6. Wavefolder (Creates complex harmonics)
export function createWavefolderCurve(gain) {
  return new Float32Array(
    [-1, 0, 1].map((x) => {
      const y = x * gain;
      return y - 4 * Math.floor((y + 1) / 4) - 2;
    }),
  );
}

// // Usage example
// const oscillator = audioManager.audioContext.createOscillator();
// oscillator.type = "sawtooth";
//
// const softClipper = createEffect(createSoftClippingCurve, 5);
// const hardClipper = createEffect(createHardClippingCurve, 0.5);
// const bitCrusher = createEffect(createBitCrushCurve, 4);
// const sineShaper = createEffect(createSineShapingCurve, 5);
// const expShaper = createEffect(createExponentialCurve, 3);
// const wavefolder = createEffect(createWavefol÷€derCurve, 2);

// Connect nodes (choose one effect at a time)
// oscillator.connect(softClipper).connect(audioManager.audioContext.mixer);
// oscillator.connect(hardClipper).connect(audioManager.audioContext.mixer);
// oscillator.connect(bitCrusher).connect(audioManager.audioContext.mixer);
// oscillator.connect(sineShaper).connect(audioManager.audioContext.mixer);
// oscillator.connect(expShaper).connect(audioManager.audioContext.mixer);
// oscillator.connect(wavefolder).connect(audioManager.audioContext.mixer);

oscillator.start();
setTimeout(() => oscillator.stop(), 2000);
