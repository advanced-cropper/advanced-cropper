import { CropperState, CropperSettings, ImageTransform } from '../types';
import { rotateImageAlgorithm } from '../algorithms/rotateImageAlgorithm';
import { flipImageAlgorithm } from '../algorithms/flipImageAlgorithm';
import { transformImageAlgorithm } from '../algorithms/transformImageAlgorithm';

export type TransformImageAlgorithm = (
	state: CropperState,
	settings: CropperSettings,
	transform: ImageTransform,
) => CropperState;

export function transformImage(
	state: CropperState,
	settings: CropperSettings,
	transform: ImageTransform,
): CropperState {

	if (transform.rotate) {
		state = rotateImageAlgorithm(state, settings, transform.rotate);
	}
	if (transform.flip) {
		state = flipImageAlgorithm(state, settings, transform.flip.horizontal, transform.flip.vertical);
	}
	if (transform.move || transform.scale) {
		state = transformImageAlgorithm(state, settings, transform);
	}

	return state;
}
