import { Brand } from "@configs/brand";
import { format } from "date-fns";

export const formatInitials = (name: string) => {
  const names = name.trim().split(/\s+/);
  const firstInitial = names[0] ? names[0][0].toUpperCase() : "";
  const lastInitial = names.length > 1 && names[names.length - 1] ? names[names.length - 1][0].toUpperCase() : "";
  return `${firstInitial}${lastInitial}`;
};

export const formatDate = (date: Date): string => {
  return format(date, Brand.formats.date);
};

export const formatTime = (date: Date): string => {
  return format(date, Brand.formats.time);
};

export const formatDateTime = (date: Date): string => {
  return `${formatDate(date)}, ${formatTime(date)}`;
};
