/**
 * @type {import('eslint')}
 */
export default {
  extends: ['mantine', 'plugin:jest/recommended', 'plugin:prettier/recommended'],
  overrides: [
    {
      plugins: ['testing-library', 'jest'],
      files: ['**/?(*.)+(spec|test).[jt]s?(x)'],
      extends: ['plugin:testing-library/react'],
    },
  ],
  parserOptions: {
    project: './tsconfig.json',
  },
};
