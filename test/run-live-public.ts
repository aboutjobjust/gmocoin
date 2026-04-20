import { runRegisteredTests } from "./helpers/harness.ts";
import "./integration/public.test.ts";

await runRegisteredTests();
