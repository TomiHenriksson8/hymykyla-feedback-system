
import { toASCII } from 'node:punycode';

export function normalizeEmail(input: string) {
  const raw = (input ?? '').trim().toLowerCase();
  const at = raw.lastIndexOf('@');
  if (at < 0) return raw;
  const local = raw.slice(0, at);
  const domain = raw.slice(at + 1);
  let asciiDomain = domain;
  try { asciiDomain = toASCII(domain); } catch { }
  return `${local}@${asciiDomain}`;
}
