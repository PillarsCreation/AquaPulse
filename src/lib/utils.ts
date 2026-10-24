import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 相对时间格式化：X小时Y分钟前
 */
export function timeAgo(isoTime: string): string {
  const diff = Date.now() - new Date(isoTime).getTime();
  if (diff < 0) return '刚刚';
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}天${hours % 24}小时前`;
  if (hours > 0) return `${hours}小时${minutes % 60}分钟前`;
  if (minutes > 0) return `${minutes}分钟前`;
  return '刚刚';
}
