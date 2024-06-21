export type Seconds = number;
export type Value = number;

export type AutomationPoint = {
  time: Seconds;
  value: Value;
};

export class AutomationCurve {
  private points: AutomationPoint[] = [];

  addPoint(time: Seconds, value: Value): void {
    this.points.push({ time, value });
    this.points.sort((a, b) => a.time - b.time); // Ensure points are sorted by time
  }

  removePoint(time: Seconds): void {
    this.points = this.points.filter((point) => point.time !== time);
  }

  getValueAtTime(time: Seconds): Value {
    if (this.points.length === 0) return 0;

    const before = this.points.filter((point) => point.time <= time).pop();
    const after = this.points.find((point) => point.time > time);

    if (!before) return this.points[0].value;
    if (!after) return this.points[this.points.length - 1].value;

    const t = (time - before.time) / (after.time - before.time);
    return this.interpolate(before.value, after.value, t);
  }

  private interpolate(start: Value, end: Value, t: number): Value {
    return start + (end - start) * t;
  }
}
