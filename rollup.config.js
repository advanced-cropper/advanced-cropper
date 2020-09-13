import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@wessberg/rollup-plugin-ts';

export default {
	input: [
		'src/algorithms.ts',
		'src/events.ts',
		'src/typings.ts',
		'src/constants.ts',
		'src/image.ts',
		'src/testing.ts',
		'src/service.ts',
		'src/utils.ts',
		'src/index.ts',
	],
	output: [
		{
			dir: 'dist',
			format: 'esm',
		},
	],
	plugins: [
		resolve(),
		commonjs(),
		typescript(),
		replace({
			'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
		}),
	],
	external: ['tslib'],
};
