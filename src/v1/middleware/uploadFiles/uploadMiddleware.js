const multer = require("multer");
const { uploads } = require("./multerSetup");

const { uploadFiles } = require("../../utils/index");
const httpStatus = require("http-status");

const { compressPhoto } = require("./compressImage");

module.exports = (uploadedFields) => {
  const uploadCarImagesOptions = uploads.fields(uploadedFields);

  return (req, res, next) => {
    uploadCarImagesOptions(req, res, async (err) => {
      // Check for errors
      if (err instanceof multer.MulterError) {
        // Delete uploaded files
        if (req.files) uploadFiles.deleteUploadedFiles(req.files);

        const error = new Error(err.message);
        error.statusCode = httpStatus.BAD_REQUEST;
        return res.status(error.statusCode).json({ message: error.message });
      } else if (err) {
        // Delete uploaded files
        if (req.files) uploadFiles.deleteUploadedFiles(req.files);

        const error = new Error("Internal server error");
        error.statusCode = 500;
        return res.status(error.statusCode).json({ message: error.message });
      }

      let missingImage = {
        missing: false,
      };

      // validate all images
      for (let image of uploadedFields) {
        if (!req.files[`${image.name}`]) {
          uploadFiles.deleteUploadedFiles(req.files);

          const error = new Error(image.name + " not uploaded.");
          error.statusCode = httpStatus.BAD_REQUEST;

          missingImage.missing = true;
          missingImage.error = error;

          break;
        }
      }

      if (missingImage.missing) {
        return res
          .status(missingImage.error.statusCode)
          .json({ message: missingImage.error.message });
      }

      try {
        for (let image of uploadedFields) {
          await compressPhoto(req.files[`${image.name}`][0].path);
        }
      } catch (err) {
        throw err;
      }

      next();
    });
  };
};
