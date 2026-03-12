import "@testing-library/jest-dom";

if (!("fetch" in globalThis)) {
  Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    value: () => Promise.reject(new Error("Global fetch was not mocked.")),
    writable: true,
  });
}

if (!("Response" in globalThis)) {
  class MockResponse {
    ok: boolean;
    private readonly payload: string;
    status: number;

    constructor(body?: BodyInit | null, init?: ResponseInit) {
      this.payload = typeof body === "string" ? body : "";
      this.status = init?.status ?? 200;
      this.ok = this.status >= 200 && this.status < 300;
    }

    async json() {
      return this.payload ? JSON.parse(this.payload) : null;
    }
  }

  Object.defineProperty(globalThis, "Response", {
    configurable: true,
    value: MockResponse,
    writable: true,
  });
}
