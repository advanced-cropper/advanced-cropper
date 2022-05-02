import { AreaSizeRestrictions, CoreSettings, CropperState, ImageRestriction } from '../types';
import { getTransformedImageSize, ratio } from '../service';

export function defaultAreaSizeRestrictions(
	state: CropperState,
	settings: CoreSettings & { imageRestriction?: ImageRestriction },
): AreaSizeRestrictions {
	const { boundary } = state;
	const { imageRestriction } = settings;

	const imageSize = getTransformedImageSize(state);

	const restrictions: AreaSizeRestrictions = {
		minWidth: 0,
		minHeight: 0,
		maxWidth: Infinity,
		maxHeight: Infinity,
	};

	if (imageRestriction === ImageRestriction.fillArea) {
		restrictions.maxWidth = imageSize.width;
		restrictions.maxHeight = imageSize.height;
	} else if (imageRestriction === ImageRestriction.fitArea) {
		if (ratio(boundary) > ratio(imageSize)) {
			restrictions.maxHeight = imageSize.height;
		} else {
			restrictions.maxWidth = imageSize.width;
		}
	}

	return restrictions;
}
