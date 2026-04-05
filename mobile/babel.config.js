const path = require('path');

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        // Always load mobile/.env even if Metro’s cwd is the monorepo root.
        path: path.join(__dirname, '.env'),
        safe: false,
        allowUndefined: true,
      },
    ],
  ],
};
