const path = require('path');

/** @param {import('@babel/core').ConfigAPI} api */
module.exports = function (api) {
  // Required so `react-native-dotenv` re-reads `mobile/.env` when it changes (otherwise Babel
  // can keep an old inlined `VITE_API_URL`, e.g. still using .167 after you switch to .137).
  api.cache(false);

  return {
    presets: ['module:@react-native/babel-preset'],
    plugins: [
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',
          path: path.join(__dirname, '.env'),
          safe: false,
          allowUndefined: true,
        },
      ],
    ],
  };
};
