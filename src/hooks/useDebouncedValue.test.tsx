import { act, renderHook } from "@testing-library/react";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";

describe("useDebouncedValue", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("updates the debounced value only after the configured delay", () => {
    const { result, rerender } = renderHook(
      ({ delay, value }) => useDebouncedValue(value, delay),
      {
        initialProps: {
          delay: 500,
          value: "San",
        },
      },
    );

    expect(result.current).toBe("San");

    rerender({
      delay: 500,
      value: "San Salvador",
    });

    expect(result.current).toBe("San");

    act(() => {
      jest.advanceTimersByTime(499);
    });

    expect(result.current).toBe("San");

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(result.current).toBe("San Salvador");
  });
});
