export class AssertionError extends Error {
  actual: unknown;
  expected: unknown;

  constructor(message: string, options?: { actual?: unknown; expected?: unknown }) {
    super(message);
    this.name = "AssertionError";
    this.actual = options?.actual;
    this.expected = options?.expected;
  }
}

type ErrorMatcher = RegExp | ((error: unknown) => boolean);

interface Assert {
  ok(value: unknown, message?: string): asserts value;
  equal(actual: unknown, expected: unknown, message?: string): void;
  deepEqual(actual: unknown, expected: unknown, message?: string): void;
  match(actual: string, expected: RegExp, message?: string): void;
  throws(input: () => unknown, expected?: ErrorMatcher): void;
  rejects(input: Promise<unknown> | (() => Promise<unknown>), expected?: ErrorMatcher): Promise<void>;
}

function fail(message: string, options?: { actual?: unknown; expected?: unknown }): never {
  throw new AssertionError(message, options);
}

function formatValue(value: unknown): string {
  if (typeof value === "string") {
    return JSON.stringify(value);
  }

  if (typeof value === "number" || typeof value === "boolean" || value == null) {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return Object.prototype.toString.call(value);
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function deepEqualInternal(
  actual: unknown,
  expected: unknown,
  seen = new WeakMap<object, object>()
): boolean {
  if (Object.is(actual, expected)) {
    return true;
  }

  if (!isObject(actual) || !isObject(expected)) {
    return false;
  }

  if (seen.get(actual) === expected) {
    return true;
  }
  seen.set(actual, expected);

  if (Array.isArray(actual) || Array.isArray(expected)) {
    if (!Array.isArray(actual) || !Array.isArray(expected) || actual.length !== expected.length) {
      return false;
    }

    for (let index = 0; index < actual.length; index += 1) {
      if (!deepEqualInternal(actual[index], expected[index], seen)) {
        return false;
      }
    }
    return true;
  }

  const actualKeys = Object.keys(actual);
  const expectedKeys = Object.keys(expected);

  if (actualKeys.length !== expectedKeys.length) {
    return false;
  }

  for (const key of actualKeys) {
    if (!(key in expected)) {
      return false;
    }

    if (!deepEqualInternal(actual[key], expected[key], seen)) {
      return false;
    }
  }

  return true;
}

function matchesError(error: unknown, expected?: ErrorMatcher): boolean {
  if (!expected) {
    return true;
  }

  if (expected instanceof RegExp) {
    const message = error instanceof Error ? error.message : String(error);
    return expected.test(message);
  }

  return expected(error);
}

async function expectReject(
  input: Promise<unknown> | (() => Promise<unknown>),
  expected?: ErrorMatcher
): Promise<void> {
  try {
    if (typeof input === "function") {
      await input();
    } else {
      await input;
    }
  } catch (error) {
    if (!matchesError(error, expected)) {
      fail("Promise rejected with an unexpected error.", { actual: error, expected });
    }
    return;
  }

  fail("Expected promise to reject.");
}

function expectThrow(input: () => unknown, expected?: ErrorMatcher): void {
  try {
    input();
  } catch (error) {
    if (!matchesError(error, expected)) {
      fail("Function threw an unexpected error.", { actual: error, expected });
    }
    return;
  }

  fail("Expected function to throw.");
}

const assert: Assert = {
  ok(value: unknown, message = "Expected value to be truthy."): asserts value {
    if (!value) {
      fail(message, { actual: value, expected: true });
    }
  },

  equal(actual: unknown, expected: unknown, message?: string): void {
    if (!Object.is(actual, expected)) {
      fail(message ?? `Expected ${formatValue(actual)} to equal ${formatValue(expected)}.`, {
        actual,
        expected
      });
    }
  },

  deepEqual(actual: unknown, expected: unknown, message?: string): void {
    if (!deepEqualInternal(actual, expected)) {
      fail(
        message ?? `Expected ${formatValue(actual)} to deeply equal ${formatValue(expected)}.`,
        {
          actual,
          expected
        }
      );
    }
  },

  match(actual: string, expected: RegExp, message?: string): void {
    if (!expected.test(actual)) {
      fail(message ?? `Expected ${formatValue(actual)} to match ${String(expected)}.`, {
        actual,
        expected
      });
    }
  },

  throws(input: () => unknown, expected?: ErrorMatcher): void {
    expectThrow(input, expected);
  },

  rejects(input: Promise<unknown> | (() => Promise<unknown>), expected?: ErrorMatcher): Promise<void> {
    return expectReject(input, expected);
  }
};

export default assert;
