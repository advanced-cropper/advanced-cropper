import { CropperSettings, CropperState, ImageRestriction } from '../types';
import { getTransformedImageSize } from '../service';

export function defaultPositionRestrictions(
	state: CropperState,
	settings: CropperSettings & { imageRestriction?: ImageRestriction },
) {
	const imageSize = getTransformedImageSize(state);

	let limits = {};

	if (settings.imageRestriction && settings.imageRestriction !== 'none') {
		limits = {
			left: 0,
			top: 0,
			right: imageSize.width,
			bottom: imageSize.height,
		};
	}

	return limits;
}
