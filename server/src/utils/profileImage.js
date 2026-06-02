const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");

const pool = require("../config/db");

const SERVER_ROOT = path.resolve(__dirname, "..", "..");
const UPLOADS_ROOT = path.join(SERVER_ROOT, "uploads");
const PROFILE_IMAGES_ROOT = path.join(UPLOADS_ROOT, "profile-images");
const PUBLIC_PROFILE_IMAGES_PREFIX = "/uploads/profile-images";
const MAX_PROFILE_IMAGE_SIZE_BYTES = 4 * 1024 * 1024;

const ALLOWED_MIME_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function resolveUploadPath(publicPath) {
  if (!publicPath || typeof publicPath !== "string") {
    return null;
  }

  const relativePath = publicPath.replace(/^\/+/, "");
  const resolvedPath = path.resolve(SERVER_ROOT, relativePath);

  if (!resolvedPath.startsWith(UPLOADS_ROOT)) {
    throw new Error("Nevažeća putanja profilne slike.");
  }

  return resolvedPath;
}

function parseBase64Image(dataUrl) {
  if (typeof dataUrl !== "string") {
    throw new Error("Profilna slika nije poslata u ispravnom formatu.");
  }

  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

  if (!match) {
    throw new Error("Profilna slika mora biti JPG, PNG, WEBP ili GIF fajl.");
  }

  const mimeType = match[1].toLowerCase();
  const extension = ALLOWED_MIME_TYPES[mimeType];

  if (!extension) {
    throw new Error("Dozvoljeni formati su JPG, PNG, WEBP i GIF.");
  }

  const buffer = Buffer.from(match[2], "base64");

  if (!buffer.length) {
    throw new Error("Profilna slika je prazna.");
  }

  if (buffer.length > MAX_PROFILE_IMAGE_SIZE_BYTES) {
    throw new Error("Profilna slika može imati najviše 4 MB.");
  }

  return { buffer, extension };
}

async function ensureProfileImageSupport() {
  await fs.mkdir(PROFILE_IMAGES_ROOT, { recursive: true });

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS profile_image_path TEXT
  `);
}

async function saveProfileImage({ userId, dataUrl }) {
  const { buffer, extension } = parseBase64Image(dataUrl);
  const fileName = `user-${userId}-${Date.now()}-${crypto
    .randomBytes(6)
    .toString("hex")}.${extension}`;
  const publicPath = `${PUBLIC_PROFILE_IMAGES_PREFIX}/${fileName}`;
  const filePath = resolveUploadPath(publicPath);

  await fs.writeFile(filePath, buffer);

  return publicPath;
}

async function removeProfileImage(publicPath) {
  const filePath = resolveUploadPath(publicPath);

  if (!filePath) return;

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

module.exports = {
  MAX_PROFILE_IMAGE_SIZE_BYTES,
  PROFILE_IMAGES_ROOT,
  UPLOADS_ROOT,
  ensureProfileImageSupport,
  saveProfileImage,
  removeProfileImage,
};
