module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: '.env',
        blacklist: null,
        whitelist: [
          'YANDEX_GPT_API_KEY',
          'YANDEX_GPT_FOLDER_ID',
          'YANDEX_GPT_MODEL_URI'
        ],
        safe: true,
        allowUndefined: false,
      }],
    ],
  };
};
