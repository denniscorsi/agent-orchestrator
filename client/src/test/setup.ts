import '@testing-library/jest-dom/vitest';

// Mock EventSource for SSE tests (jsdom does not provide it)
class MockEventSource {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;

  readyState = MockEventSource.CONNECTING;
  url: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onopen: ((event: Event) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    // Simulate connection opening asynchronously
    setTimeout(() => {
      this.readyState = MockEventSource.OPEN;
      if (this.onopen) this.onopen(new Event('open'));
    }, 0);
  }

  close() {
    this.readyState = MockEventSource.CLOSED;
  }

  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return false; }
}

globalThis.EventSource = MockEventSource as unknown as typeof EventSource;
