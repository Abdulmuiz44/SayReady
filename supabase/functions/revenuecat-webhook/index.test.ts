import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

import { handleRevenuecatWebhook } from "./index.ts";

const withEnv = async (fn: () => Promise<void>) => {
  Deno.env.set("SUPABASE_URL", "https://example.supabase.co");
  Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "service-role");
  Deno.env.set("OPENAI_API_KEY", "unused");
  Deno.env.set("REVENUECAT_WEBHOOK_SECRET", "secret");
  await fn();
};

Deno.test("revenuecat webhook deduplicates duplicate delivery by unique violation", async () => {
  await withEnv(async () => {
    const req = new Request("http://localhost/revenuecat-webhook", {
      method: "POST",
      headers: { "X-Authorization": "secret", "Content-Type": "application/json" },
      body: JSON.stringify({
        event: {
          id: "evt_123",
          app_user_id: "71b1bda6-3c4e-4f6f-a629-d2b20c6b0f93",
          type: "INITIAL_PURCHASE",
          event_timestamp_ms: Date.now(),
        },
      }),
    });

    const response = await handleRevenuecatWebhook(req, {
      createSupabase: () => ({
        from: () => ({
          insert: async () => ({ error: { code: "23505" } }),
        }),
      } as any),
    });

    const body = await response.json();
    assertEquals(response.status, 200);
    assertEquals(body.deduplicated, true);
  });
});
