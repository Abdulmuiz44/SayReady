import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

import { handleRequestDataExport } from "./index.ts";

Deno.test("request-data-export rejects missing auth header", async () => {
  const req = new Request("http://localhost/request-data-export", { method: "POST" });

  const response = await handleRequestDataExport(req);
  const body = await response.json();

  assertEquals(response.status, 401);
  assertEquals(body.error, "unauthorized");
});
