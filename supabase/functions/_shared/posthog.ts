const POSTHOG_API_HOST = "https://us.i.posthog.com";

type TrackParams = {
  distinctId: string;
  event: string;
  properties?: Record<string, unknown>;
};

export const trackServerEvent = async (params: TrackParams): Promise<void> => {
  const apiKey = Deno.env.get("POSTHOG_API_KEY");
  if (!apiKey) return;

  try {
    await fetch(`${POSTHOG_API_HOST}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        distinct_id: params.distinctId,
        event: params.event,
        properties: params.properties ?? {},
      }),
      signal: AbortSignal.timeout(3_000),
    });
  } catch {
    // graceful no-op
  }
};
