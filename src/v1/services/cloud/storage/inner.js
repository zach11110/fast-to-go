const { Storage } = require("@google-cloud/storage");
const path = require("path");
const server = require("../../../config/system/server");
const localStorage = require("../../storage/local");

// Create an instance of Google Storage
const storage = new Storage({
  keyFilename: path.join(
    __dirname,
    "../../../config/system/service-account.json"
  ),
});

module.exports.uploadFile = async (file = { name: "", path: "" }) => {
  try {
    // Decide upload options
    const options = {
      destination: file.name,
      // preconditionOpts: {
      //   ifGenerationMatch: 0,
      // },
    };

    // Upload file to storage bucket
    const cloudFile = await storage
      .bucket(server.BUCKET_NAME)
      .upload(file.path, options);

    // Return file URL
    return cloudFile[1].mediaLink;
  } catch (err) {
    console.log(err);
    // Delete local file in case of error
    await localStorage.deleteFile(file.path);
    throw err;
  }
};

module.exports.deleteFile = async (fileURL) => {
  try {
    // Check file's URL
    if (!fileURL) {
      return;
    }

    // Parse file name from the URL
    const fileName = fileURL.split("/o/")[1].split("?")[0];

    // Delete file from the bucket
    await storage.bucket(server.BUCKET_NAME).file(fileName).delete();

    return true;
  } catch (err) {
    throw err;
  }
};
