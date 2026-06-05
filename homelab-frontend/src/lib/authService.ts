export async function signChallengeWithPrivateKey(privateKeyPem: string, challenge: string): Promise<string> {
  // Extract base64 content from PEM or accept raw base64
  const pemMatch = privateKeyPem.match(/-----BEGIN[^-]*-----([\s\S]*)-----END[^-]*-----/);
  const base64Content = (pemMatch ? pemMatch[1] : privateKeyPem).replace(/[\n\r\t\s]/g, '').trim();

  // Validate base64
  const invalidChars = base64Content.match(/[^A-Za-z0-9+/=]/g);
  if (invalidChars) {
    throw new Error('Private key contains invalid characters');
  }

  const binaryKey = Uint8Array.from(atob(base64Content), (c) => c.charCodeAt(0));

  const importedKey = await window.crypto.subtle.importKey(
    'pkcs8',
    binaryKey.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await window.crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    importedKey,
    new TextEncoder().encode(challenge)
  );

  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return signatureBase64;
}
