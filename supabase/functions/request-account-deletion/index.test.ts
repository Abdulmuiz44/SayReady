import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

import { handleRequestAccountDeletion } from "./index.ts";

Deno.test("request-account-deletion rejects missing auth header", async () => {
  const req = new Request("http://localhost/request-account-deletion", { method: "POST" });

  const response = await handleRequestAccountDeletion(req);
  const body = await response.json();

  assertEquals(response.status, 401);
  assertEquals(body.error, "unauthorized");
});
