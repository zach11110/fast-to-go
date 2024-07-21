const axios = require('axios')

module.exports = async  (expoPushToken,content) => {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: content.title,
    body: content.body,
  };

  return await axios.post('https://exp.host/--/api/v2/push/send', message,{ headers: {
      Accept: 'application/json',
      "Accept-encoding": 'gzip, deflate',
      'Content-Type': 'application/json',
    },
 })
}


