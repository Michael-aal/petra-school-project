const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const getDataUriBytes = (value) => {
  if (typeof value !== "string" || !value.startsWith("data:")) return 0;
  const comma = value.indexOf(",");
  if (comma < 0) return 0;
  const encoded = value.slice(comma + 1);
  return Math.floor((encoded.length * 3) / 4);
};

export const enforceUploadLimits = (req, res, next) => {
  const contentLength = Number(req.get("content-length") || 0);
  const limit = req.path.includes("avatar") ? MAX_IMAGE_BYTES : MAX_DOCUMENT_BYTES;
  if (contentLength > limit) {
    return res.status(413).json({ success: false, message: `Uploaded files must not exceed ${limit / (1024 * 1024)}MB.` });
  }

  const documents = Array.isArray(req.body?.documents) ? req.body.documents : [];
  const encodedBytes = documents.reduce((total, document) => total + getDataUriBytes(document?.fileData), 0);
  if (encodedBytes > MAX_DOCUMENT_BYTES) {
    return res.status(413).json({ success: false, message: "Bulk document uploads must not exceed 10MB." });
  }
  if (documents.some((document) => typeof document?.fileData === "string" && document.fileData.startsWith("data:"))) {
    return res.status(400).json({ success: false, message: "Base64 file uploads are not supported; provide a temporary file URL." });
  }
  return next();
};
