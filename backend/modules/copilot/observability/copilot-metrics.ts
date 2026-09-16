export interface CopilotMetrics {
  increment(name: string, tags?: Record<string, string>): void;
  observe(name: string, value: number, tags?: Record<string, string>): void;
  gauge(name: string, value: number, tags?: Record<string, string>): void;
}

export class NoopCopilotMetrics implements CopilotMetrics {
  increment(): void {}
  observe(): void {}
  gauge(): void {}
}

export type RecordedMetric =
  | { kind: 'increment'; name: string; tags?: Record<string, string> }
  | { kind: 'observe'; name: string; value: number; tags?: Record<string, string> }
  | { kind: 'gauge'; name: string; value: number; tags?: Record<string, string> };

export class TestCopilotMetrics implements CopilotMetrics {
  readonly events: RecordedMetric[] = [];

  increment(name: string, tags?: Record<string, string>): void {
    this.events.push({ kind: 'increment', name, tags });
  }

  observe(name: string, value: number, tags?: Record<string, string>): void {
    this.events.push({ kind: 'observe', name, value, tags });
  }

  gauge(name: string, value: number, tags?: Record<string, string>): void {
    this.events.push({ kind: 'gauge', name, value, tags });
  }
}

export const noopCopilotMetrics = new NoopCopilotMetrics();
