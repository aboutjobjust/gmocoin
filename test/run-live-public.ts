import { loadLocalTestConfig } from "./helpers/load-local-config.ts";
import { runRegisteredTests } from "./helpers/harness.ts";

await loadLocalTestConfig();
await import("./integration/public.test.ts");
await runRegisteredTests();
