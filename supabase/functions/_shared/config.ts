export type AppConfig = {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  openAiApiKey: string;
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
  openAiApiKey: requireEnv("OPENAI_API_KEY"),
  transcriptionModel: optionalEnv("OPENAI_TRANSCRIPTION_MODEL", "gpt-4o-mini-transcribe"),
  evaluationModel: optionalEnv("OPENAI_EVALUATION_MODEL", "gpt-4.1-mini"),
  freeTierDailyEvaluationLimit: optionalIntEnv("FREE_TIER_DAILY_EVALUATION_LIMIT", 3),
  revenueCatWebhookSecret: optionalEnv("REVENUECAT_WEBHOOK_SECRET", ""),
  appTimeZoneDefault: optionalEnv("APP_DEFAULT_TIMEZONE", "UTC"),
});
