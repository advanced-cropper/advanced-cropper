import { CropperSettings, CropperState, ImageRestriction, Limits } from '../types';
import { ratio, getTransformedImageSize } from '../service';

export function defaultAreaPositionRestrictions(
	state: CropperState,
	settings: CropperSettings & { imageRestriction?: ImageRestriction },
): Limits {
	const { visibleArea, boundary } = state;
	const { imageRestriction } = settings;

	const imageSize = getTransformedImageSize(state);

	let limits: Limits = {};

	if (imageRestriction === 'fillArea') {
		limits = {
			left: 0,
			top: 0,
			right: imageSize.width,
			bottom: imageSize.height,
		};
	} else if (imageRestriction === 'fitArea') {
		if (ratio(boundary) > ratio(imageSize)) {
			limits = {
				top: 0,
				bottom: imageSize.height,
			};
			if (visibleArea) {
				if (visibleArea.width > imageSize.width) {
					limits.left = -(visibleArea.width - imageSize.width) / 2;
					limits.right = imageSize.width - limits.left;
				} else {
					limits.left = 0;
					limits.right = imageSize.width;
				}
			}
		} else {
			limits = {
				left: 0,
				right: imageSize.width,
			};
			if (visibleArea) {
				if (visibleArea.height > imageSize.height) {
					limits.top = -(visibleArea.height - imageSize.height) / 2;
					limits.bottom = imageSize.height - limits.top;
				} else {
					limits.top = 0;
					limits.bottom = imageSize.height;
				}
			}
		}
	}

	return limits;
}
