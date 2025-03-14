const fs = require("fs");
const sharp = require("sharp");
const crypto = require("crypto");
const utils = require("../../../utils");
var fileType = require("file-type");
const { rootDir } = require("../../../utils/index");
const { join } = require("path");

module.exports.storeFile = async (file, title = "", compress = true) => {
  let path = "";

  try {
    // Reading input file

    const readFile = Buffer.from(file.base, "base64");
    // Decide file's name on disk
    const diskName = title
      ? `${title}_${utils.getCurrentDate()}`
      : crypto.randomUUID();
    // console.log(readFile);
    // Get file's extenstion
    const extension = await fileType.fromBuffer(readFile);
    // Writing file to local disk storage
    let name = diskName + ".jpg";

    if (extension) {
      name = utils.filterName(`${diskName}.${extension.ext}`);
    }

    path = join(rootDir, "uploads", `${name}`);

    fs.writeFileSync(path, readFile);

    if (compress) {
      const isCompressed = await this.compressPhoto(path);

      if (isCompressed) {
        return { originalName: file?.name, name, path };
      }
    } else {
      return { originalName: file?.name, name, path };
    }
  } catch (err) {
    // Delete stored file in case of error
    await this.deleteFile(path);
    throw err;
  }
};

module.exports.deleteFile = async (filePath) => {
  try {
    fs.unlink(filePath, (err) => {
      if (err) {
        throw err;
      }
      return;
    });
    return true;
  } catch (err) {
    throw err;
  }
};

module.exports.compressPhoto = async (path) => {
  try {
    // resize and compress the image using sharp
    const outputBuffer = await sharp(path)
      .resize(400, 400) // set the maximum width and height to 400 pixels
      .png({ quality: 80 }) // compress the image to 80% quality PNG
      .toBuffer();

    fs.writeFileSync(path, outputBuffer);

    return outputBuffer;
  } catch (err) {
    console.log(err);
    await this.deleteFile(path);

    throw err;
  }
};
