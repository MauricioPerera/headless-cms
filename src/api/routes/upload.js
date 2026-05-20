const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const UPLOAD_DIR = path.resolve(__dirname, '../../../static/assets/images');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Usar almacenamiento en memoria temporal para procesar con sharp
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Solo se permiten imagenes'));
  }
});

router.post('/', requireAuth, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se subio ninguna imagen' });

  const uniqueBase = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const largeFilename = `${uniqueBase}-large.webp`;
  const mediumFilename = `${uniqueBase}-medium.webp`;
  const thumbFilename = `${uniqueBase}-thumb.webp`;

  try {
    const buffer = req.file.buffer;
    const largePath = path.join(UPLOAD_DIR, largeFilename);
    const mediumPath = path.join(UPLOAD_DIR, mediumFilename);
    const thumbPath = path.join(UPLOAD_DIR, thumbFilename);

    // Large/Original (max 1600 width)
    await sharp(buffer)
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(largePath);

    // Medium (max 800 width)
    await sharp(buffer)
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(mediumPath);

    // Thumbnail (max 300 width)
    await sharp(buffer)
      .resize({ width: 300, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(thumbPath);

    const basePath = process.env.BASE_PATH || '/';
    const url = basePath + 'assets/images/' + largeFilename;
    res.json({
      url,
      filename: largeFilename,
      originalname: req.file.originalname,
      sizes: {
        large: basePath + 'assets/images/' + largeFilename,
        medium: basePath + 'assets/images/' + mediumFilename,
        thumb: basePath + 'assets/images/' + thumbFilename
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Fallo al procesar la imagen con sharp: ' + err.message });
  }
});

module.exports = router;
