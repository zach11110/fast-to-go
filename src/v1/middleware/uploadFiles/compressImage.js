const fs = require("fs");

const sharp = require("sharp");

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
    // await this.deleteFile(path);
    console.log(err);
    throw err;
  }
};
