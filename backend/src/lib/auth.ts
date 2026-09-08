import jwt, {
  type JwtPayload,
  type SignOptions,
  TokenExpiredError,
  JsonWebTokenError,
} from "jsonwebtoken";

const decodeKey = (name: "JWT_PRIVATE_KEY" | "JWT_PUBLIC_KEY"): Buffer => {
  const encoded = process.env[name];
  if (!encoded) {
    throw new Error(`${name} is required before authentication can start.`);
  }
  if (encoded.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
    throw new Error(`${name} must be a valid Base64-encoded RSA key.`);
  }

  try {
    const decoded = Buffer.from(encoded, "base64");
    if (!decoded.length) throw new Error("decoded key is empty");
    return decoded;
  } catch (error) {
    throw new Error(`${name} must be a valid Base64-encoded RSA key.`, { cause: error });
  }
};

export const signToken = (payload: object, expiresIn = "7d"): string => {
  const privateKey = decodeKey("JWT_PRIVATE_KEY");
  const options: SignOptions = {
    algorithm: "RS256",
    expiresIn: expiresIn as SignOptions["expiresIn"],
    keyid: process.env.JWT_KEY_ID || "petra-2026",
  };
  return jwt.sign(payload, privateKey, options);
};

export const verifyToken = <T>(token: string): T => {
  if (!token.trim()) throw new Error("Authentication token is required.");

  try {
    const publicKey = decodeKey("JWT_PUBLIC_KEY");
    const decoded = jwt.verify(token, publicKey, { algorithms: ["RS256"] });
    return decoded as T;
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      throw new Error("Authentication token has expired.", { cause: error });
    }
    if (error instanceof JsonWebTokenError) {
      throw new Error("Authentication token is invalid.", { cause: error });
    }
    throw error;
  }
};

export type VerifiedToken = JwtPayload;
