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

const uploadSingleImage = (fieldName) => {
  return [
    upload.single(fieldName),

    async (req, res, next) => {
      try {
        if (!req.file) {
          return next();
        }

        const imageUrl = await uploadToCloudinary(req.file.buffer, 'alumnet');

        req.uploadedImageUrl = imageUrl;

        next();
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Image upload failed',
        });
      }
    },
  ];
};

module.exports = {
  uploadSingleImage,
};
