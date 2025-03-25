import {User} from "../../entity/user.model";

export function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export function formatToYYYYMMDD(date: Date): string {
  return new Date(date).toISOString().split('T')[0];
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function showAdminSection(user: User, admins: User[]): boolean {
  return user.isAdmin || admins.length === 0;
}