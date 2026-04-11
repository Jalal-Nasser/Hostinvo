export type PublicKeyCredentialCreationOptionsJSON = {
  publicKey: PublicKeyCredentialCreationOptionsJSONPayload;
};

export type PublicKeyCredentialCreationOptionsJSONPayload = Omit<
  PublicKeyCredentialCreationOptions,
  "challenge" | "user" | "excludeCredentials"
> & {
  challenge: string;
  user: Omit<PublicKeyCredentialUserEntity, "id"> & { id: string };
  excludeCredentials?: Array<Omit<PublicKeyCredentialDescriptor, "id"> & { id: string }>;
};

export type PublicKeyCredentialRequestOptionsJSON = {
  publicKey: PublicKeyCredentialRequestOptionsJSONPayload;
};

export type PublicKeyCredentialRequestOptionsJSONPayload = Omit<
  PublicKeyCredentialRequestOptions,
  "challenge" | "allowCredentials"
> & {
  challenge: string;
  allowCredentials?: Array<Omit<PublicKeyCredentialDescriptor, "id"> & { id: string }>;
};

export type SerializedCredential = {
  id: string;
  rawId: string;
  type: string;
  transports?: string[];
  response: {
    clientDataJSON: string;
    attestationObject?: string;
    authenticatorData?: string;
    signature?: string;
    userHandle?: string | null;
  };
};

export function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function base64UrlDecode(value: string): ArrayBuffer {
  const padded = value.padEnd(Math.ceil(value.length / 4) * 4, "=");
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes.buffer;
}

export function toCreationOptions(
  payload: PublicKeyCredentialCreationOptionsJSON,
): PublicKeyCredentialCreationOptions {
  const publicKey = payload.publicKey;

  return {
    ...publicKey,
    challenge: base64UrlDecode(publicKey.challenge),
    user: {
      ...publicKey.user,
      id: base64UrlDecode(publicKey.user.id),
    },
    excludeCredentials: publicKey.excludeCredentials?.map((credential) => ({
      ...credential,
      id: base64UrlDecode(credential.id),
    })),
  };
}

export function toRequestOptions(
  payload: PublicKeyCredentialRequestOptionsJSON,
): PublicKeyCredentialRequestOptions {
  const publicKey = payload.publicKey;

  return {
    ...publicKey,
    challenge: base64UrlDecode(publicKey.challenge),
    allowCredentials: publicKey.allowCredentials?.map((credential) => ({
      ...credential,
      id: base64UrlDecode(credential.id),
    })),
  };
}

export function serializeCredential(credential: PublicKeyCredential): SerializedCredential {
  const response = credential.response as AuthenticatorAttestationResponse | AuthenticatorAssertionResponse;
  const serialized: SerializedCredential = {
    id: credential.id,
    rawId: base64UrlEncode(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: base64UrlEncode(response.clientDataJSON),
    },
  };

  if ("attestationObject" in response) {
    serialized.response.attestationObject = base64UrlEncode(response.attestationObject);
  }

  if ("authenticatorData" in response) {
    serialized.response.authenticatorData = base64UrlEncode(response.authenticatorData);
  }

  if ("signature" in response) {
    serialized.response.signature = base64UrlEncode(response.signature);
  }

  if ("userHandle" in response) {
    serialized.response.userHandle = response.userHandle
      ? base64UrlEncode(response.userHandle)
      : null;
  }

  if (credential instanceof PublicKeyCredential && "getTransports" in response) {
    const transports = (response as AuthenticatorAttestationResponse).getTransports?.();
    if (transports?.length) {
      serialized.transports = transports;
    }
  }

  return serialized;
}
