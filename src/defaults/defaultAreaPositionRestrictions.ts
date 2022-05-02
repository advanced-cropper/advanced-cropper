import { CoreSettings, CropperState, ImageRestriction, PositionRestrictions } from '../types';
import { getTransformedImageSize, ratio } from '../service';

export function defaultAreaPositionRestrictions(
	state: CropperState,
	settings: CoreSettings & { imageRestriction?: ImageRestriction },
): PositionRestrictions {
	const { visibleArea, boundary } = state;
	const { imageRestriction } = settings;

	const imageSize = getTransformedImageSize(state);

	let restrictions: PositionRestrictions = {};

	if (imageRestriction === ImageRestriction.fillArea) {
		restrictions = {
			left: 0,
			top: 0,
			right: imageSize.width,
			bottom: imageSize.height,
		};
	} else if (imageRestriction === ImageRestriction.fitArea) {
		if (ratio(boundary) > ratio(imageSize)) {
			restrictions = {
				top: 0,
				bottom: imageSize.height,
			};
			if (visibleArea) {
				if (visibleArea.width > imageSize.width) {
					restrictions.left = -(visibleArea.width - imageSize.width) / 2;
					restrictions.right = imageSize.width - restrictions.left;
				} else {
					restrictions.left = 0;
					restrictions.right = imageSize.width;
				}
			}
		} else {
			restrictions = {
				left: 0,
				right: imageSize.width,
			};
			if (visibleArea) {
				if (visibleArea.height > imageSize.height) {
					restrictions.top = -(visibleArea.height - imageSize.height) / 2;
					restrictions.bottom = imageSize.height - restrictions.top;
				} else {
					restrictions.top = 0;
					restrictions.bottom = imageSize.height;
				}
			}
		}
	}

	return restrictions;
}
