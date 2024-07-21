const { model } = require("mongoose");
const schema = require("./schema");


const WorkSpace = model("WorkSpace", schema.mongodb);

module.exports = {
  WorkSpace,
  clientSchema: schema.client,
};
