import { runRegisteredTests } from "./helpers/harness.ts";
import "./integration/private-readonly.test.ts";

await runRegisteredTests();
