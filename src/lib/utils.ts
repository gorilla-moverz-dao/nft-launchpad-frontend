import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ClassValue } from "clsx";

export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs));
}

/**
 * Convert APT to oapt (smallest unit, integer)
 */
export function aptToOapt(apt: string | number): number {
  return Math.round(Number(apt) * 1e8);
}

/**
 * Convert oapt (smallest unit) to APT
 */
export function oaptToApt(oapt: string | number): number {
  return Number(oapt) / 1e8;
}

export function toDecimals(number: number, decimals: number): number {
  return Number(number) / Math.pow(10, decimals);
}

export function fromDecimals(number: number, decimals: number): number {
  return Number(number) * Math.pow(10, decimals);
}

export function toShortAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Ensure an address has the proper "0x" prefix and correct length
 */
export function ensureHexPrefix(address: string): `0x${string}` {
  // Remove any existing 0x prefix to normalize
  const cleanAddress = address.startsWith("0x") ? address.slice(2) : address;

  // Pad with leading zeros to ensure 64 characters (32 bytes)
  const paddedAddress = cleanAddress.padStart(64, "0");

  return `0x${paddedAddress}`;
}
