const fs = require("fs");

module.exports.deleteUploadedFiles = (files) => {
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
