export class HttpError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const jsonResponse = (payload: unknown, status = 200): Response => {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const sanitizeErrorResponse = (error: unknown): Response => {
  if (error instanceof HttpError) {
    return jsonResponse({ error: error.code, message: error.message }, error.status);
  }

  console.error("Unhandled server error", error);
  return jsonResponse(
    { error: "internal_error", message: "An internal error occurred." },
    500,
  );
};
