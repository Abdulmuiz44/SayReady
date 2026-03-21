export type AppConfig = {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  mistralApiKey: string;
  transcriptionModel: string;
  evaluationModel: string;
  freeTierDailyEvaluationLimit: number;
  revenueCatWebhookSecret: string;
  appTimeZoneDefault: string;
};

const requireEnv = (name: string): string => {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const optionalEnv = (name: string, fallback: string): string => {
  return Deno.env.get(name) ?? fallback;
};

const optionalIntEnv = (name: string, fallback: number): number => {
  const raw = Deno.env.get(name);
  if (!raw) return fallback;

  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    throw new Error(`Environment variable ${name} must be a non-negative integer`);
  }

  return parsed;
};

export const getConfig = (): AppConfig => ({
  supabaseUrl: requireEnv("SUPABASE_URL"),
  supabaseServiceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  mistralApiKey: requireEnv("MISTRAL_API_KEY"),
  transcriptionModel: optionalEnv("MISTRAL_TRANSCRIPTION_MODEL", "voxtral-mini-latest"),
  evaluationModel: optionalEnv("MISTRAL_EVALUATION_MODEL", "mistral-small-latest"),
  freeTierDailyEvaluationLimit: optionalIntEnv("FREE_TIER_DAILY_EVALUATION_LIMIT", 3),
  revenueCatWebhookSecret: optionalEnv("REVENUECAT_WEBHOOK_SECRET", ""),
  appTimeZoneDefault: optionalEnv("APP_DEFAULT_TIMEZONE", "UTC"),
});
