const normalizeKey = (name) => {
  const configured = String(process.env[name] || "").replace(/\\n/g, "\n").trim();
  if (!configured) throw new Error(`${name} is not configured.`);
  if (configured.includes("-----BEGIN")) return configured;

  try {
    const decoded = Buffer.from(configured, "base64").toString("utf8").trim();
    if (!decoded.includes("-----BEGIN")) throw new Error("decoded value is not a PEM key");
    return decoded;
  } catch (error) {
    throw new Error(`${name} must contain a PEM key or base64-encoded PEM key.`, { cause: error });
  }
};

export const getJwtPrivateKey = () => normalizeKey("JWT_PRIVATE_KEY");
export const getJwtPublicKey = () => normalizeKey("JWT_PUBLIC_KEY");
