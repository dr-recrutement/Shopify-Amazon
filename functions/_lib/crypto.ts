// Shared AES-256-GCM helpers for encrypting vendor payment-gateway secrets
// at rest. This is the server-side encryption step that was noted as a
// follow-up in src/lib/tenant-sync.ts: the key is derived (SHA-256) from
// PAYMENT_API_KEY_ENCRYPTION_SECRET, a Cloudflare Pages environment
// variable that lives only on the server and is never shipped to the
// client — unlike client-side encryption with an embedded key, this is
// real protection for data at rest.
//
// Ciphertext is stored as base64(iv) + ':' + base64(ciphertext), so a
// stored value is distinguishable from any legacy plaintext row (which
// won't contain ':' followed by valid base64 in that shape) — decryptSecret
// tolerates those by returning them unchanged so existing rows keep working
// until the merchant re-saves the gateway, at which point they get encrypted.

async function deriveKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-256', enc.encode(secret));
  return crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

function toBase64(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function fromBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export async function encryptSecret(plaintext: string, secret: string): Promise<string> {
  if (!plaintext) return '';
  if (!secret) return plaintext; // no key configured yet — don't silently corrupt data
  const key = await deriveKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext));
  return `${toBase64(iv)}:${toBase64(new Uint8Array(cipherBuf))}`;
}

const CIPHERTEXT_SHAPE = /^[A-Za-z0-9+/]+=*:[A-Za-z0-9+/]+=*$/;

export async function decryptSecret(stored: string, secret: string): Promise<string> {
  if (!stored) return '';
  if (!secret || !CIPHERTEXT_SHAPE.test(stored)) return stored; // legacy plaintext row, or no key configured
  try {
    const [ivB64, dataB64] = stored.split(':');
    const key = await deriveKey(secret);
    const iv = fromBase64(ivB64);
    const data = fromBase64(dataB64);
    const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    return new TextDecoder().decode(plainBuf);
  } catch {
    // Not actually our ciphertext (e.g. a plaintext key that happened to
    // match the shape) — fall back to treating it as plaintext.
    return stored;
  }
}

export function maskSecret(plaintext: string): string {
  if (!plaintext) return '';
  if (plaintext.length <= 4) return '••••';
  return `••••${plaintext.slice(-4)}`;
}
