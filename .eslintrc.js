module.exports = {
  parser: '@typescript-eslint/parser', // Specifies the ESLint parser
  parserOptions: {
    ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
    sourceType: 'module', // Allows for the use of imports
    ecmaFeatures: {
      jsx: true, // Allows for the parsing of JSX
    },
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'], // Your TypeScript files extension

      parserOptions: {
        project: __dirname + '/tsconfig.json',
      },
    },
  ],
  settings: {
    react: {
      version: 'detect', // Tells eslint-plugin-react to automatically detect the version of React to use
    },
  },
  extends: [
    'next', // Uses the recommended rules from next
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended', // Enables eslint-plugin-prettier and eslint-config-prettier. This will display prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
  ],
  ignorePatterns: ['next/*', 'node_modules/*', 'scripts/*'],
  rules: {
    // Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs
    'react/react-in-jsx-scope': 'off', // In React 17, you no longer need to import React
    'import/no-anonymous-default-export': 'off', // Allow anonymous default exports
    '@typescript-eslint/explicit-module-boundary-types': 'off', // Allow implicit return types
    '@typescript-eslint/no-explicit-any': 'off', // Allow any type
    '@typescript-eslint/no-non-null-assertion': 'off', // Allow empty interfaces
    '@typescript-eslint/no-empty-function': 'off', // Allow empty functions
    'react-hooks/exhaustive-deps': 'off', // Allow exhaustive-deps
    'prettier/prettier': [
      'error',
      // fixes lint complaining about CRLF line endings on windows
      {
        endOfLine: 'auto',
      },
    ],
  },
}
