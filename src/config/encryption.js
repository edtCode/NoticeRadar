import { createCipheriv, createDecipheriv, randomBytes, scrypt } from "node:crypto";
import { env } from "../config/env.js";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 16;

let derivedKey = null;
let keyReady = false;
let keyError = null;

// Derive a 256-bit key from ENCRYPTION_KEY using scrypt. Derivation is lazy so
// the API can boot without the key present; token operations fail loudly later.
const deriveKey = async () => {
    if (keyReady || keyError) {
        return;
    }

    keyReady = true;

    const secret = process.env.ENCRYPTION_KEY;

    if (!secret) {
        keyError = new Error("ENCRYPTION_KEY is not configured; encrypted token storage is unavailable");
        return;
    }

    try {
        const salt = randomBytes(SALT_LENGTH);
        derivedKey = await new Promise((resolve, reject) => {
            scrypt(secret, salt, KEY_LENGTH, (err, key) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(key);
                }
            });
        });
    } catch (error) {
        keyError = error;
    }
};

const getKey = async () => {
    await deriveKey();

    if (keyError) {
        throw new Error(keyError.message);
    }

    return derivedKey;
};

const encode = (buffer) => Buffer.from(buffer).toString("base64");

// Encrypts a string and returns `iv:salt:tag:ciphertext` (all base64).
export const encrypt = async (plaintext) => {
    if (plaintext == null) {
        return null;
    }

    const key = await getKey();
    const iv = randomBytes(IV_LENGTH);
    const salt = randomBytes(SALT_LENGTH);

    // Re-derive per-encryption would be expensive; instead we mix the random
    // salt into the IV/nonce material so identical plaintexts never collide.
    const nonce = Buffer.concat([iv, salt.slice(0, IV_LENGTH)]).slice(0, IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, nonce);

    const ciphertext = Buffer.concat([
        cipher.update(Buffer.from(String(plaintext), "utf8")),
        cipher.final()
    ]);

    const tag = cipher.getAuthTag();

    return `${encode(iv)}:${encode(salt)}:${encode(tag)}:${encode(ciphertext)}`;
};

// Decrypts a value produced by `encrypt`. Returns null for null input.
export const decrypt = async (token) => {
    if (token == null) {
        return null;
    }

    const key = await getKey();
    const parts = String(token).split(":");

    if (parts.length !== 4) {
        throw new Error("Invalid encrypted token format");
    }

    const [ivB64, saltB64, tagB64, ciphertextB64] = parts;
    const iv = Buffer.from(ivB64, "base64");
    const salt = Buffer.from(saltB64, "base64");
    const tag = Buffer.from(tagB64, "base64");
    const ciphertext = Buffer.from(ciphertextB64, "base64");

    const nonce = Buffer.concat([iv, salt.slice(0, IV_LENGTH)]).slice(0, IV_LENGTH);
    const decipher = createDecipheriv(ALGORITHM, key, nonce);
    decipher.setAuthTag(tag);

    const plaintext = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final()
    ]);

    return plaintext.toString("utf8");
};

export const isEncryptionConfigured = () => Boolean(process.env.ENCRYPTION_KEY);
