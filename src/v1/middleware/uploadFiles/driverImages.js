const uploadMiddleWare = require("./uploadMiddleware");

exports.driverImagesFileds = [
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
];

exports.uploadDriverImages = uploadMiddleWare(this.driverImagesFileds);

// const uploadCarImagesOptions = uploads.fields(driverImagesFileds);

// exports.uploadCarImages = (req, res, next) => {
//   uploadCarImagesOptions(req, res, (err) => {
//     // Check for errors
//     if (err instanceof multer.MulterError) {
//       // Delete uploaded files
//       if (req.files) uploadFiles.deleteUploadedFiles(req.files);

//       const error = new Error(err.message);
//       error.statusCode = httpStatus.BAD_REQUEST;
//       return res.status(error.statusCode).json({ message: error.message });
//     } else if (err) {
//       // Delete uploaded files
//       if (req.files) uploadFiles.deleteUploadedFiles(req.files);

//       const error = new Error("Internal server error");
//       error.statusCode = 500;
//       return res.status(error.statusCode).json({ message: error.message });
//     }

//     let missingImage = {
//       missing: false,
//     };

//     // validate all images
//     for (let image of driverImagesFileds) {
//       if (!req.files[`${image.name}`]) {
//         uploadFiles.deleteUploadedFiles(req.files);

//         const error = new Error(image.name + " not uploaded.");
//         error.statusCode = httpStatus.BAD_REQUEST;

//         missingImage.missing = true;
//         missingImage.error = error;

//         break;
//       }
//     }

//     if (missingImage.missing) {
//       return res
//         .status(missingImage.error.statusCode)
//         .json({ message: missingImage.error.message });
//     }

//     console.log(req.files); // Log received files
//     res.send("done");
//   });
// };
