import { mergeTestConfig, type TestConfig } from "./config.ts";

interface LocalConfigModule {
  default?: TestConfig;
}

export async function loadLocalTestConfig(): Promise<void> {
  try {
    const module = (await import("../local-config.local.ts")) as LocalConfigModule;

    if (module.default) {
      mergeTestConfig(module.default);
    }
  } catch (error) {
    if (isMissingModuleError(error)) {
      return;
    }

    throw error;
  }
}

function isMissingModuleError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const withCode = error as Error & { code?: string };
  return withCode.code === "ERR_MODULE_NOT_FOUND";
}
