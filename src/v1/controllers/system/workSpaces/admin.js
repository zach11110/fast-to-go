const { clientSchema } = require("../../../models/system/workSpace");
const { workSpacesService } = require("../../../services");
const httpStatus = require("http-status");
const _ = require("lodash");

module.exports.addWorkSpace = async (req, res, next) => {
  try {
    const workSpace = req.body;

    const result = await workSpacesService.addWorkSpace(workSpace);

    const response = _.pick(result, clientSchema);

    return res.status(httpStatus.OK).json(response);
  } catch (error) {
    next(error);
  }
};

module.exports.getWorkSpaces = async (req, res, next) => {
  try {
    const spaces = await workSpacesService.getWorkSpaces();
    res.status(httpStatus.OK).json(spaces);
  } catch (error) {
    next(error);
  }
};

module.exports.deleteWorkSpace = async (req, res, next) => {
  const id = req.params;

  try {
    const result = await workSpacesService.deleteWorkSpace(id);

    res.status(httpStatus.OK).json(result);
  } catch (error) {
    next(error);
  }
};
