export type MutationResult =
  | { success: true }
  | { success: false; error: string };

export type PostgrestErrorLike = {
  message?: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
};

export function formatSupabaseError(error: PostgrestErrorLike | Error | unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (!error || typeof error !== "object") {
    return String(error ?? "Unknown error");
  }

  const pgError = error as PostgrestErrorLike;
  const parts = [
    pgError.message,
    pgError.code ? `code: ${pgError.code}` : null,
    pgError.details ? `details: ${pgError.details}` : null,
    pgError.hint ? `hint: ${pgError.hint}` : null,
  ].filter(Boolean);

  return parts.join(" | ") || "Unknown error";
}

export function logDeleteStep(
  scope: string,
  step: string,
  status: "start" | "ok" | "fail",
  detail?: string,
) {
  const prefix = `[${scope}] ${step}...`;
  if (status === "start") {
    console.log(prefix);
    return;
  }

  if (status === "ok") {
    console.log(`${prefix} ✓ OK`);
    return;
  }

  console.error(`${prefix} ✗ ${detail ?? "FAILED"}`);
}

export function logSupabaseError(scope: string, step: string, cause: unknown) {
  console.error(`[${scope}] ${step} error:`, cause);

  if (cause && typeof cause === "object") {
    const pgError = cause as PostgrestErrorLike;
    console.error({
      message: pgError.message,
      code: pgError.code,
      details: pgError.details,
      hint: pgError.hint,
    });
  }
}

export function mutationError(
  scope: string,
  step: string,
  message: string,
  cause?: PostgrestErrorLike | Error | unknown,
): { success: false; error: string } {
  logSupabaseError(scope, step, cause);

  const detail = formatSupabaseError(cause);
  logDeleteStep(scope, step, "fail", detail);

  if (
    cause &&
    typeof cause === "object" &&
    "code" in cause &&
    (cause as PostgrestErrorLike).code === "42501"
  ) {
    return {
      success: false,
      error: `${message}：無刪除權限。請確認已登入管理員帳號。 | ${detail}`,
    };
  }

  return {
    success: false,
    error: `${message}：${detail}`,
  };
}
