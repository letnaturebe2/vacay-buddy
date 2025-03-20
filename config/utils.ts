export function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export function formatToYYYYMMDD(date: Date): string {
  return new Date(date).toISOString().split('T')[0];
}
