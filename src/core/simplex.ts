export class OpenSimplexNoise {
  private static readonly STRETCH_CONSTANT_2D = -0.211324865405187;
  private static readonly SQUISH_CONSTANT_2D = 0.366025403784439;
  private static readonly NORM_CONSTANT_2D = 47;
  private perm: number[] = new Array(256);
  private permGradIndex2D: number[] = new Array(256);
  private gradients2D: number[] = [5, 2, 2, 5, -5, 2, -2, 5, 5, -2, 2, -5, -5, -2, -2, -5];

  constructor(seed: number) {
    let source: number[] = new Array(256);
    for (let i = 0; i < 256; i++) source[i] = i;
    seed = this.xorshift32(seed);
    seed = this.xorshift32(seed);
    seed = this.xorshift32(seed);
    for (let i = 255; i >= 0; i--) {
      seed = this.xorshift32(seed);
      let r = (seed + 31) % (i + 1);
      if (r < 0) r += i + 1;
      this.perm[i] = source[r];
      this.permGradIndex2D[i] = (this.perm[i] % (this.gradients2D.length / 2)) * 2;
      source[r] = source[i];
    }
  }

  private xorshift32(x: number): number {
    x ^= x << 13;
    x ^= x >> 17;
    x ^= x << 5;
    return x;
  }

  private extrapolate(xsb: number, ysb: number, dx: number, dy: number): number {
    let index = this.permGradIndex2D[(this.perm[xsb & 0xff] + ysb) & 0xff];
    return this.gradients2D[index] * dx + this.gradients2D[index + 1] * dy;
  }

  noise2D(x: number, y: number): number {
    let stretchOffset = (x + y) * OpenSimplexNoise.STRETCH_CONSTANT_2D;
    let xs = x + stretchOffset;
    let ys = y + stretchOffset;
    let xsb = Math.floor(xs);
    let ysb = Math.floor(ys);
    let squishOffset = (xsb + ysb) * OpenSimplexNoise.SQUISH_CONSTANT_2D;
    let dx0 = x - (xsb + squishOffset);
    let dy0 = y - (ysb + squishOffset);
    let xins = xs - xsb;
    let yins = ys - ysb;
    let inSum = xins + yins;
    let hash = ((xins - yins + 1) | 0) + (((inSum * inSum + inSum) / 2) | 0);
    let value = 0;
    switch (hash & 7) {
      case 0:
      case 1:
      case 2:
      case 3:
        let dx1 = dx0 - 1 - OpenSimplexNoise.SQUISH_CONSTANT_2D;
        let dy1 = dy0 - 0 - OpenSimplexNoise.SQUISH_CONSTANT_2D;
        value +=
          (0.5 - dx1 * dx1 - dy1 * dy1) * (0.5 - dx1 * dx1 - dy1 * dy1) * this.extrapolate(xsb + 1, ysb, dx1, dy1);
        dx1 = dx0 - 0 - OpenSimplexNoise.SQUISH_CONSTANT_2D;
        dy1 = dy0 - 1 - OpenSimplexNoise.SQUISH_CONSTANT_2D;
        value +=
          (0.5 - dx1 * dx1 - dy1 * dy1) * (0.5 - dx1 * dx1 - dy1 * dy1) * this.extrapolate(xsb, ysb + 1, dx1, dy1);
        if (inSum <= 1) {
          dx1 = dx0 - 1 - 2 * OpenSimplexNoise.SQUISH_CONSTANT_2D;
          dy1 = dy0 - 1 - 2 * OpenSimplexNoise.SQUISH_CONSTANT_2D;
          value +=
            (0.5 - dx1 * dx1 - dy1 * dy1) *
            (0.5 - dx1 * dx1 - dy1 * dy1) *
            this.extrapolate(xsb + 1, ysb + 1, dx1, dy1);
        }
        break;
      case 4:
      case 5:
      case 6:
      case 7:
        let dx2 = dx0 - 0 - 2 * OpenSimplexNoise.SQUISH_CONSTANT_2D;
        let dy2 = dy0 - 0 - 2 * OpenSimplexNoise.SQUISH_CONSTANT_2D;
        value += (0.5 - dx2 * dx2 - dy2 * dy2) * (0.5 - dx2 * dx2 - dy2 * dy2) * this.extrapolate(xsb, ysb, dx2, dy2);
        dx2 = dx0 - 1 - 2 * OpenSimplexNoise.SQUISH_CONSTANT_2D;
        dy2 = dy0 - 1 - 2 * OpenSimplexNoise.SQUISH_CONSTANT_2D;
        value +=
          (0.5 - dx2 * dx2 - dy2 * dy2) * (0.5 - dx2 * dx2 - dy2 * dy2) * this.extrapolate(xsb + 1, ysb + 1, dx2, dy2);
        break;
    }
    return value / OpenSimplexNoise.NORM_CONSTANT_2D;
  }
}

export const generateOpenSimplexWaveform = (
  samples: number = 512,
  frequency: number = 1.0,
  seed: number = 42,
): number[] => {
  const noise = new OpenSimplexNoise(seed);
  const waveform: number[] = new Array(samples);
  for (let i = 0; i < samples; i++) {
    waveform[i] = noise.noise2D((i * frequency) / samples, 0);
  }
  // Normalize the waveform to be between -1 and 1
  const min = Math.min(...waveform);
  const max = Math.max(...waveform);
  const range = max - min;
  if (range === 0) return new Array(samples).fill(0);
  for (let i = 0; i < samples; i++) {
    waveform[i] = ((waveform[i] - min) / range) * 2 - 1;
  }
  return waveform;
};
