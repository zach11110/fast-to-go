const { workSpacesController } = require("../../../controllers");
const auth = require("../../../middleware/auth");

module.exports = (router) => {
  router.post(
    "/add",
    auth("createAny", "workSpace"),
    workSpacesController.addWorkSpace
  );

  router.get("/get", workSpacesController.getWorkSpaces);

  router.delete(
    "/delete/:id",
    auth("deleteAny", "workSpace"),
    workSpacesController.deleteWorkSpace
  );
};
