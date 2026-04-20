import { runRegisteredTests } from "./helpers/harness.ts";
import "./unit/client.test.ts";
import "./unit/websocket.test.ts";

await runRegisteredTests();
