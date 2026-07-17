import { describe, it, expect } from 'vitest';
import { signChallengeWithPrivateKey } from './authService';

describe('signChallengeWithPrivateKey', () => {
  it('rejects a private key containing invalid base64 characters', async () => {
    await expect(
      signChallengeWithPrivateKey('not a real key !!!***', 'challenge'),
    ).rejects.toThrow('Private key contains invalid characters');
  });

  it('rejects when the PEM body has illegal characters', async () => {
    const pem = '-----BEGIN PRIVATE KEY-----\n@@@invalid@@@\n-----END PRIVATE KEY-----';
    await expect(signChallengeWithPrivateKey(pem, 'challenge')).rejects.toThrow(
      'Private key contains invalid characters',
    );
  });

  it('accepts a clean base64 PEM body past validation (fails later only at the WebCrypto import)', async () => {
    // A well-formed but non-key base64 payload clears the character-validation gate; the function
    // then fails inside SubtleCrypto.importKey rather than with the "invalid characters" error.
    // (The real RSA signing round-trip is a browser-API integration concern, not a unit test.)
    const pem = '-----BEGIN PRIVATE KEY-----\nQUJDRA==\n-----END PRIVATE KEY-----';
    await expect(signChallengeWithPrivateKey(pem, 'challenge')).rejects.not.toThrow(
      'Private key contains invalid characters',
    );
  });
});
