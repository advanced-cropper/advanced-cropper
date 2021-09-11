module.exports = {
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: 'module',
		ecmaFeatures: {
			jsx: true,
		},
	},
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:prettier/recommended',
		'prettier/@typescript-eslint',
	],
	rules: {
		'@typescript-eslint/no-non-null-assertion': 'off',
		'@typescript-eslint/explicit-function-return-type': 'off',
		'no-mixed-spaces-and-tabs': ['error', 'smart-tabs'],
		'no-console': ['error', {
			'allow': ['warn', 'error'],
		}]
	},
	env: {
		browser: true,
		node: true,
		es6: true,
		jest: true
	},
};
