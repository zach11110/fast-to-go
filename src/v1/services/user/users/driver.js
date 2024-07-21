const { User } = require("../../../models/user/user");


module.exports.toggleDriverConnected = async (user) => {

  
  // return conosle.log(user)
  try {
    const driver = await User.findOne(user._id)
    
    driver.toggleDriverConnected();

    // Save user to the DB
    await driver.save();

    return user;
  } catch (err) {
    throw err;
  }
};


module.exports.setBusy = async (user,busy) => {
  try {
        
        user.setBusy(busy)
       await user.save();

    return user;
  } catch (err) {
    throw(err)
  }
}