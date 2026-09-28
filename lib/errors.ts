export class AppError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "AppError";
    this.status = status;
  }
}

export function messageOf(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}
