const { WorkSpace } = require("../../../models/system/workSpace");
const httpStatus = require("http-status");
const { ApiError } = require("../../../middleware/apiError");

module.exports.addWorkSpace = async ({ workSpace }) => {
  try {
    if (!workSpace) {
      console.log("in error!");
      const statusCode = httpStatus[500];
      throw new ApiError(statusCode, "invaled request");
    }
    const place = new WorkSpace(workSpace);
    await place.save();

    return place;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

module.exports.getWorkSpaces = async () => {
  try {
    const spaces = await WorkSpace.find();

    return spaces;
  } catch (error) {
    throw error;
  }
};

module.exports.deleteWorkSpace = async ({ id }) => {
  try {
    const data = await WorkSpace.findByIdAndDelete(id);

    return data;
  } catch (error) {
    throw error;
  }
};
