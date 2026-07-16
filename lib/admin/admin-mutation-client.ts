import { createPaymentClient, createServerClient, isSupabaseConfigured } from "@/lib/supabase";

/** Admin mutations: service role when configured, otherwise authenticated server client. */
export async function getAdminMutationClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return createPaymentClient();
  }

  return createServerClient();
}
