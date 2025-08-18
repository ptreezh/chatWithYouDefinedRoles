import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { compareTwoStrings } from 'string-similarity';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateSimilarity(str1: string, str2: string): number {
  return compareTwoStrings(str1, str2);
}
