const { Car } = require("../../../models/user/car");
const cloudStorage = require("../../cloud/storage");
const localStorage = require("../../storage/local");
const httpStatus = require("http-status");
const errors = require("../../../config/errors");
const { ApiError } = require("../../../middleware/apiError");

module.exports.addCar = async (
  driver,
  plateNumber,
  productionYear,
  model,
  color,
  avatar,
  photo1,
  photo2,
  photo3,
  photo4,
  brochure,
  driverLicense,
  insurance,
  passport
) => {
  try {
    // Check if the driver has added a car before
    if (driver.carId) {
      const statusCode = httpStatus.FORBIDDEN;
      const message = errors.user.addedCarBefore;
      throw new ApiError(statusCode, message);
    }

    // If we get here, images should be compressed and stored in uploads
    // 1. upload photos to the cloud.
    // 2. delete local image.
    // 4. create new car.
    // 5. save new car
    // 3. update driver

    const photos = {
      photo1,
      photo2,
      photo3,
      photo4,
      avatar,
      brochure,
      driverLicense,
      insurance,
      passport,
    };

    // Upload photos to the storage bucket
    const photoURLs = {};

    Object.keys(photos).forEach(async (key) => {
      try {
        // Store file locally in the `uploads` folder
        const localPhoto = await localStorage.storeFile(photos[key]);

        // Upload file from `uploads` folder to cloud bucket
        const cloudPhotoURL = await cloudStorage.uploadFile(localPhoto);

        // Delete local file
        await localStorage.deleteFile(localPhoto.path);

        photoURLs[key] = cloudPhotoURL;
      } catch (err) {
        console.log(err);
        throw err;
      }
    });

    setTimeout(async () => {
      // Create new car for the driver
      console.log(photoURLs);
      const car = new Car({
        driver: driver._id,
        color,
        model,
        plateNumber,
        productionYear,
        documents: {
          brochure: photoURLs.brochure,
          driverLicense: photoURLs.driverLicense,
          insurance: photoURLs.insurance,
          passport: photoURLs.passport,
        },
        photos: [
          photoURLs.photo1,
          photoURLs.photo2,
          photoURLs.photo3,
          photoURLs.photo4,
        ],
      });

      // Save car to the DB
      await car.save();

      // Update driver
      driver.updateAvatarURL(photoURLs.avatar);
      driver.carId = car._id;
      await driver.save();

      return car;
    }, 10000);
  } catch (err) {
    console.log(err);
    throw new ApiError(500, errors.system.fileUploadError);
  }
};

module.exports.getCar = async (id) => {
  try {
    const car = await Car.findOne({ _id: id });

    return car;
  } catch (error) {
    throw error;
  }
};
