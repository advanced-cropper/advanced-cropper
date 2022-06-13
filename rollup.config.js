import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
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
		'src/extensions/absoluteZoom/index.ts',
		'src/extensions/stencilSize/index.ts',
		'src/extensions/preventZoom/index.ts',
		'src/extensions/defaultState/index.ts',
		'src/extensions/fitToImage/index.ts',
		'src/showcase/telegram/index.ts',
		'src/animation.ts',
		'src/canvas.ts',
		'src/transforms.ts',
		'src/image.ts',
		'src/types.ts',
		'src/utils.ts',
	],
	preserveModules: true,
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
