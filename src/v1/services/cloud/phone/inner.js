const axios = require("axios");

exports.sendOTP = async (phoneNSN, code) => {
  try {
    return await axios.get(
      `https://api.libyasms.com:3236/sendtext?apikey=${process.env.SMS_API_KEY}&secretkey=${process.env.SMS_SECRET_KEY}&callerID=${process.env.SMS_CALLER_ID}&toUser=218${phoneNSN}&messageContent=your verify code is: ${code}`
    );
  } catch (err) {
    throw err;
  }
};
