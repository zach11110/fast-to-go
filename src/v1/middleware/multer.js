const fs = require("fs");

const multer = require("multer");

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads");
  },
  filename: (req, file, cb) => {
    cb(null, Math.round(Math.random() * 1e9) + "." + getExt(file.mimetype));
  },
});

const getExt = (mimetype) => {
  return mimetype.split("/")[1];
};

const uploads = multer({
  storage: fileStorage,
  limits: { fileSize: 1024 * 1024 * 5 },
});

const uploadCarImagesOptions = uploads.fields([
  {
    name: "avatar",
  },
  {
    name: "photo1",
  },
  {
    name: "photo2",
  },
  {
    name: "photo3",
  },
  {
    name: "photo4",
  },
  {
    name: "brochure",
  },
  {
    name: "driverLicense",
  },
  {
    name: "insurance",
  },
  {
    name: "passport",
  },
]);

exports.uploadCarImages = (req, res, next) => {
  uploadCarImagesOptions(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (req.files) deleteUploadedFiles(req.files);
      return res.status(500).json({ error: `Multer error: ${err.message}` });
    } else if (err) {
      if (req.files) deleteUploadedFiles(req.files);
      return res.status(500).json({ error: `Unknown error: ${err.message}` });
    }

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ error: "No files were uploaded." });
    }

    console.log(req.files); // Log received files
    res
      .status(200)
      .json({ message: "Files uploaded successfully!", files: req.files });
  });
};

const deleteUploadedFiles = (files) => {
  Object.keys(files).forEach((field) => {
    files[field].forEach((file) => {
      fs.unlink(file.path, (err) => {
        if (err) {
          console.error(`Error deleting file ${file.path}:`, err);
        }
      });
    });
  });
};
