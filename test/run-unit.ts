import { loadLocalTestConfig } from "./helpers/load-local-config.ts";
import { runRegisteredTests } from "./helpers/harness.ts";

await loadLocalTestConfig();
await import("./unit/client.test.ts");
await import("./unit/websocket.test.ts");
await runRegisteredTests();
