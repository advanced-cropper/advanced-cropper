import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@wessberg/rollup-plugin-ts';

export default {
	input: [
		'src/html/index.ts',
		'src/algorithms/index.ts',
		'src/service/index.ts',
		'src/state/index.ts',
		'src/defaults/index.ts',
		'src/instance/index.ts',
		'src/extensions/absolute-zoom/index.ts',
		'src/extensions/stencil-size/index.ts',
		'src/extensions/prevent-zoom/index.ts',
		'src/extensions/fit-to-image/index.ts',
		'src/showcase/telegram/index.ts',
		'src/animation.ts',
		'src/upload.ts',
		'src/canvas.ts',
		'src/transforms.ts',
		'src/image.ts',
		'src/types.ts',
		'src/utils.ts',
		'src/index.ts',
	],
	preserveModules: true,
	output: [
		{
			dir: 'dist',
			format: 'es',
		},
	],
	plugins: [resolve(), commonjs(), typescript()],
	external: ['tslib'],
};
