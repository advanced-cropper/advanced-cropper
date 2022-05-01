import { CropperState, CropperSettings, ImageTransform } from '../types';
import { flipImageAlgorithm, transformImageAlgorithm, rotateImageAlgorithm } from '../algorithms';

export interface TransformImageOptions {
	adjustStencil?: boolean;
}

export type TransformImageAlgorithm = (
	state: CropperState,
	settings: CropperSettings,
	transform: ImageTransform,
	options?: TransformImageOptions,
) => CropperState;

export function transformImage(
	state: CropperState,
	settings: CropperSettings,
	transform: ImageTransform,
	options: TransformImageOptions = {},
): CropperState {
	if (transform.rotate) {
		state = rotateImageAlgorithm(state, settings, transform.rotate);
	}
	if (transform.flip) {
		state = flipImageAlgorithm(state, settings, transform.flip.horizontal, transform.flip.vertical);
	}
	if (transform.move || transform.scale) {
		state = transformImageAlgorithm(state, settings, transform, options);
	}

	return state;
}
