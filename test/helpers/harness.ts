type TestFunction = () => void | Promise<void>;

interface RegisteredTest {
  name: string;
  run: TestFunction;
  skipped: boolean;
}

type TestRegistrar = ((name: string, run: TestFunction) => void) & {
  skip(name: string, run: TestFunction): void;
};

const registeredTests: RegisteredTest[] = [];

function registerTest(name: string, run: TestFunction, skipped: boolean): void {
  registeredTests.push({ name, run, skipped });
}

export const test = ((name: string, run: TestFunction) => {
  registerTest(name, run, false);
}) as TestRegistrar;

test.skip = (name: string, run: TestFunction) => {
  registerTest(name, run, true);
};

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.stack ?? `${error.name}: ${error.message}`;
  }

  return String(error);
}

export async function runRegisteredTests(): Promise<void> {
  let passed = 0;
  let failed = 0;
  let skipped = 0;

  for (const entry of registeredTests) {
    if (entry.skipped) {
      skipped += 1;
      console.log(`- ${entry.name} (skipped)`);
      continue;
    }

    try {
      await entry.run();
      passed += 1;
      console.log(`ok ${entry.name}`);
    } catch (error) {
      failed += 1;
      console.error(`not ok ${entry.name}`);
      console.error(formatError(error));
    }
  }

  registeredTests.length = 0;
  console.log(`\n${passed} passed, ${failed} failed, ${skipped} skipped`);

  if (failed > 0) {
    throw new Error(`${failed} test(s) failed.`);
  }
}
