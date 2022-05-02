import { CropperState, CoreSettings, ImageTransform, ModifiersSettings } from '../types';
import { flipImageAlgorithm, transformImageAlgorithm, rotateImageAlgorithm } from '../algorithms';

export type TransformImageAlgorithm<
	Settings extends CoreSettings & ModifiersSettings = CoreSettings & ModifiersSettings
> = (state: CropperState, settings: Settings, transform: ImageTransform) => CropperState;

export function transformImage(
	state: CropperState,
	settings: CoreSettings & ModifiersSettings,
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
