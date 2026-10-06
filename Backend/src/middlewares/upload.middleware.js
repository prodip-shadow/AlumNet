const fs = require('fs');
const path = require('path');
const multer = require('multer');
const uploadToCloudinary = require('../services/cloudinary.service');

const storage = multer.memoryStorage();

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPG, PNG and WEBP images are allowed'));
    }

    cb(null, true);
  },
});

const cvUpload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/octet-stream',
    ];

    if (!allowedTypes.includes(file.mimetype) && !file.originalname.match(/\.(pdf|doc|docx|png|jpg|jpeg|webp)$/i)) {
      return cb(new Error('Only PDF, Word documents or image files are allowed for CV'));
    }

    cb(null, true);
  },
});

const uploadSingleImage = (fieldName) => {
  return [
    (req, res, next) => {
      upload.single(fieldName)(req, res, async (err) => {
        if (err) {
          if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
              return res.status(400).json({
                success: false,
                message: 'Image size exceeds 5MB limit. Please upload an image under 5MB.',
              });
            }
            return res.status(400).json({
              success: false,
              message: `Upload error: ${err.message}`,
            });
          }
          return res.status(400).json({
            success: false,
            message: err.message || 'Failed to upload image',
          });
        }

        if (!req.file) {
          return next();
        }

        try {
          const imageUrl = await uploadToCloudinary(req.file.buffer, 'alumnet');
          req.uploadedImageUrl = imageUrl;
          next();
        } catch (error) {
          return res.status(500).json({
            success: false,
            message: 'Image upload failed',
          });
        }
      });
    },
  ];
};

const uploadSingleCv = (fieldName) => {
  return [
    (req, res, next) => {
      cvUpload.single(fieldName)(req, res, async (err) => {
        if (err) {
          if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
              return res.status(400).json({
                success: false,
                message: 'File size exceeds 5MB limit. Please upload a file under 5MB.',
              });
            }
            return res.status(400).json({
              success: false,
              message: `Upload error: ${err.message}`,
            });
          }
          return res.status(400).json({
            success: false,
            message: err.message || 'Failed to upload CV',
          });
        }

        if (!req.file) {
          return next();
        }

        try {
          // Attempt Cloudinary upload first
          const isPdf = req.file.mimetype === 'application/pdf' || req.file.originalname.toLowerCase().endsWith('.pdf');
          const format = isPdf ? 'pdf' : undefined;
          const cvUrl = await uploadToCloudinary(req.file.buffer, 'alumnet/cv', 'auto', format);
          req.uploadedCvUrl = cvUrl;
          return next();
        } catch (cloudErr) {
          console.warn('Cloudinary CV upload failed, writing to local storage fallback:', cloudErr.message || cloudErr);

          const uploadsDir = path.join(__dirname, '../../uploads/cv');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }

          let fileExt = path.extname(req.file.originalname).toLowerCase();
          if (!fileExt) fileExt = '.pdf';

          const fileName = `cv-${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExt}`;
          const filePath = path.join(uploadsDir, fileName);

          fs.writeFileSync(filePath, req.file.buffer);

          const host = req.get('host');
          const protocol = req.protocol;
          req.uploadedCvUrl = `${protocol}://${host}/uploads/cv/${fileName}`;
          return next();
        }
      });
    },
  ];
};

module.exports = {
  uploadSingleImage,
  uploadSingleCv,
};
