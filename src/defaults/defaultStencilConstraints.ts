import { RawAspectRatio } from '../types';
import { isFunction } from '../utils';
import { createAspectRatio } from '../service';

interface StencilOptions {
	aspectRatio?: (() => RawAspectRatio) | RawAspectRatio;
}

interface RawSettings {
	aspectRatio?: unknown;
}

export function defaultStencilConstraints(rawSettings: RawSettings, stencilProps: StencilOptions) {
	if (!rawSettings.aspectRatio) {
		return {
			aspectRatio: createAspectRatio(
				isFunction(stencilProps.aspectRatio) ? stencilProps.aspectRatio() : stencilProps.aspectRatio,
			),
		};
	}
	return {};
}
