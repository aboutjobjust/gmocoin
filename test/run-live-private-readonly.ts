import { loadLocalTestConfig } from "./helpers/load-local-config.ts";
import { runRegisteredTests } from "./helpers/harness.ts";

await loadLocalTestConfig();
await import("./integration/private-readonly.test.ts");
await runRegisteredTests();
