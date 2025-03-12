/**
 * @type {import('eslint')}
 */
export default {
  extends: ['mantine', 'plugin:jest/recommended', 'plugin:prettier/recommended'],
  plugins: ['testing-library', 'jest'],
  overrides: [
    {
      files: ['**/?(*.)+(spec|test).[jt]s?(x)'],
      extends: ['plugin:testing-library/react'],
    },
  ],
  parserOptions: {
    project: './tsconfig.json',
  },
};
