module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es6: true
  },
  globals: {
    defineProps: 'readonly',
    defineEmits: 'readonly',
    defineExpose: 'readonly',
    withDefaults: 'readonly'
  },
  extends: [
    'plugin:vue/vue3-essential',
    'eslint:recommended'
  ],
  parserOptions: {
    parser: 'babel-eslint',
    ecmaVersion: 2020
  },
  rules: {
    'no-undef': 'off',
    'no-redeclare': 'off',
    'no-async-promise-executor': 'off',
    'no-restricted-properties': 'off'
    // Temporariamente desabilitado para permitir window.$traccar e window.$tarkan
    /*
    'no-restricted-properties': [
      'error',
      {
        object: 'window',
        property: '$traccar',
        message: 'Use runtimeApi (inject/getRuntimeApi) ao invés de window.$traccar. Refs legadas foram removidas.'
      },
      {
        object: 'window',
        property: '$tarkan',
        message: 'Use runtimeApi (inject/getRuntimeApi) ao invés de window.$tarkan. Refs legadas foram removidas.'
      }
    ]
    */
  }
}
