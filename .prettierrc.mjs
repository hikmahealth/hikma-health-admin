/**
 * @type {import("prettier").Config}
 */
export default {
  arrowParens: 'always',
  bracketSpacing: true,
  jsxBracketSameLine: false,
  jsxSingleQuote: false,
  quoteProps: 'as-needed',
  singleQuote: true,
  semi: true,
  printWidth: 100,
  useTabs: false,
  tabWidth: 2,
  trailingComma: 'es5',
  plugins: [
    'prettier-plugin-tailwindcss',
    'prettier-plugin-twin.macro',
    'prettier-plugin-organize-imports',
  ],
};
