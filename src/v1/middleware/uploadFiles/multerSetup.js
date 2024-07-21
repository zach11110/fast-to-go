const multer = require("multer");

// Configure sotrage folder and files name
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads");
  },
  filename: (req, file, cb) => {
    cb(null, Math.round(Math.random() * 1e9) + "." + getExt(file.mimetype));
  },
});

// Extract file extension from mimetype
const getExt = (mimetype) => {
  return mimetype.split("/")[1];
};

// Initiate multer
exports.uploads = multer({
  storage: fileStorage,
  limits: { fileSize: 1024 * 1024 * 5 },
});
