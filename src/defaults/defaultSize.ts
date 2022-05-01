import { CropperSettings, CropperState, Size } from '../types';
import {
	ratio,
	positionToSizeRestrictions,
	getPositionRestrictions,
	getSizeRestrictions,
	approximateSize,
} from '../service';
import { isFunction } from '../utils';

export function defaultSize(state: CropperState, settings: CropperSettings): Size {
	const { imageSize, visibleArea } = state;

	const sizeRestrictions = getSizeRestrictions(state, settings);

	const aspectRatio = isFunction(settings.aspectRatio) ? settings.aspectRatio(state, settings) : settings.aspectRatio;

	let area;
	if (visibleArea) {
		area = visibleArea;
	} else {
		const sizeRestrictions = positionToSizeRestrictions(getPositionRestrictions(state, settings));
		area = {
			width: Math.max(sizeRestrictions.minWidth, Math.min(sizeRestrictions.maxWidth, imageSize.width)),
			height: Math.max(sizeRestrictions.minHeight, Math.min(sizeRestrictions.maxHeight, imageSize.height)),
		};
	}

	const optimalRatio = Math.min(aspectRatio.maximum || Infinity, Math.max(aspectRatio.minimum || 0, ratio(area)));

	const size =
		area.width < area.height
			? {
					width: area.width * 0.8,
					height: (area.width * 0.8) / optimalRatio,
			  }
			: {
					height: area.height * 0.8,
					width: area.height * 0.8 * optimalRatio,
			  };

	return approximateSize({
		...size,
		aspectRatio,
		sizeRestrictions: sizeRestrictions,
	});
}
