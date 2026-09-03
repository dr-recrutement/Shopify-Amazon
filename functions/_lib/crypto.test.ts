import { describe, it, expect } from 'vitest';
import { encryptSecret, decryptSecret, maskSecret } from './crypto';

describe('vendor gateway crypto', () => {
  it('round-trips a secret through encrypt/decrypt with the right key', async () => {
    const plaintext = 'sk_live_super_secret_1234';
    const key = 'test-encryption-secret';
    const stored = await encryptSecret(plaintext, key);
    expect(stored).not.toBe(plaintext);
    expect(stored).toContain(':');
    const decrypted = await decryptSecret(stored, key);
    expect(decrypted).toBe(plaintext);
  });

  it('produces a different ciphertext each time (random IV)', async () => {
    const key = 'test-encryption-secret';
    const a = await encryptSecret('same-value', key);
    const b = await encryptSecret('same-value', key);
    expect(a).not.toBe(b);
  });

  it('fails closed when decrypting with the wrong key', async () => {
    const stored = await encryptSecret('sk_live_abc', 'key-one');
    const decrypted = await decryptSecret(stored, 'key-two');
    expect(decrypted).not.toBe('sk_live_abc');
  });

  it('passes through legacy plaintext rows unchanged', async () => {
    const legacyPlaintext = 'sk_live_never_encrypted';
    const decrypted = await decryptSecret(legacyPlaintext, 'test-encryption-secret');
    expect(decrypted).toBe(legacyPlaintext);
  });

  it('returns empty string for empty input', async () => {
    expect(await encryptSecret('', 'k')).toBe('');
    expect(await decryptSecret('', 'k')).toBe('');
  });

  it('masks a secret to its last 4 characters', () => {
    expect(maskSecret('sk_live_abcd1234')).toBe('••••1234');
    expect(maskSecret('')).toBe('');
    expect(maskSecret('ab')).toBe('••••');
  });
});
