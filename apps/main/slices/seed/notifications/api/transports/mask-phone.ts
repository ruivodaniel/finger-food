/** Phone numbers never reach a log in full — last four digits at most. */
export function maskPhone(phoneNumber: string): string {
  return phoneNumber.length <= 4 ? "[redacted]" : `***${phoneNumber.slice(-4)}`;
}
