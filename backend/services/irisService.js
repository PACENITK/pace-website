const axios = require('axios');
const config = require('../config/env');

class IrisService {
  async exchangeCodeForToken(code) {
    try {
      const response = await axios.post(config.IRIS_TOKEN_URL, {
        client_id: config.IRIS_CLIENT_ID,
        client_secret: config.IRIS_CLIENT_SECRET,
        code,
        redirect_uri: config.IRIS_CALLBACK_URL,
        grant_type: 'authorization_code',
      });
      return response.data.access_token;
    } catch (error) {
      const errMsg = error.response && error.response.data ? JSON.stringify(error.response.data) : error.message;
      throw new Error(`IRIS Token Exchange Failed: ${errMsg}`);
    }
  }

  async getProfile(accessToken) {
    try {
      const response = await axios.get(config.IRIS_PROFILE_URL, {
        params: {
          access_token: accessToken,
        },
      });
      return response.data;
    } catch (error) {
      const errMsg = error.response && error.response.data ? JSON.stringify(error.response.data) : error.message;
      throw new Error(`IRIS Profile Fetch Failed: ${errMsg}`);
    }
  }
}

module.exports = new IrisService();
