export type TestConfig = Record<string, string | undefined>;

type TestGlobal = typeof globalThis & {
  GMO_TEST_CONFIG?: TestConfig;
  process?: {
    env?: TestConfig;
  };
};

export function mergeTestConfig(config: TestConfig): void {
  const runtime = globalThis as TestGlobal;
  runtime.GMO_TEST_CONFIG = {
    ...(runtime.GMO_TEST_CONFIG ?? {}),
    ...config
  };
}

export function readTestConfig(name: string, fallback?: string): string | undefined {
  const runtime = globalThis as TestGlobal;

  return runtime.GMO_TEST_CONFIG?.[name] ?? runtime.process?.env?.[name] ?? fallback;
}
