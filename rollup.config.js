import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@wessberg/rollup-plugin-ts';
import copy from 'rollup-plugin-copy';
import del from 'rollup-plugin-delete';

export default {
	input: [
		'src/algorithms/index.ts',
		'src/service/index.ts',
		'src/state/index.ts',
		'src/defaults/index.ts',
		'src/instance/index.ts',
		'src/extensions/absolute-zoom/index.ts',
		'src/extensions/stencil-size/index.ts',
		'src/extensions/prevent-zoom/index.ts',
		'src/extensions/fit-to-image/index.ts',
		'src/extensions/mimes/index.ts',
		'src/showcase/telegram/index.ts',
		'src/animation/index.ts',
		'src/canvas/index.ts',
		'src/boundary/index.ts',
		'src/image/index.ts',
		'src/types/index.ts',
		'src/utils/index.ts',
		'src/index.ts',
	],
	preserveModules: true,
	output: [
		{
			dir: 'dist',
			format: 'es',
		},
		{
			dir: 'dist/node',
			format: 'cjs',
		},
	],
	plugins: [
		resolve(),
		commonjs(),
		typescript(),
		copy({
			targets: [
				{ src: 'src/styles/**/*', dest: 'dist/styles' },
				{ src: 'src/themes/**/*', dest: 'dist/themes' },
			],
		}),
	],
	external: ['tslib'],
};
