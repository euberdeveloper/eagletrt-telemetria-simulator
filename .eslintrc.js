const path = require('path');

module.exports = {
    parserOptions: {
        project: path.join(__dirname, 'source', 'tsconfig.json')
    },
    plugins: ['@euberdeveloper'],
    extends: [
        'plugin:@euberdeveloper/typescript',
        'plugin:@euberdeveloper/prettier'
    ],
    rules: {
        '@typescript-eslint/restrict-template-expressions': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-unnecessary-condition': 'off'
    }
};