import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extracts a display name from an email address.
 * Example: "john.doe@example.com" -> "John Doe"
 * Example: "jane@example.com" -> "Jane"
 */
export function getDisplayNameFromEmail(email: string): string {
  if (!email) return '';
  
  // Get the part before @
  const username = email.split('@')[0];
  
  // Replace dots and underscores with spaces
  let name = username.replace(/[._]/g, ' ');
  
  // Capitalize first letter of each word
  name = name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  return name;
}
