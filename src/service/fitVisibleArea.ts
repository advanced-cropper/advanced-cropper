import {
	applyMove,
	diff,
	moveToPositionRestrictions,
	getCenter,
	mergePositionRestrictions,
	ratio,
	toLimits,
} from './utils';
import { CropperSettings, CropperState } from '../types';
import { getAreaPositionRestrictions, getAreaSizeRestrictions, getPositionRestrictions } from './helpers';
import { copyState } from '../state';
import { approximateSize } from './approximateSize';

export function fitVisibleArea(state: CropperState, settings: CropperSettings) {
	const result = copyState(state);

	const areaSizeRestrictions = getAreaSizeRestrictions(state, settings);

	// Fit the visible area to its size restrictions and boundary aspect ratio:
	result.visibleArea = {
		...result.visibleArea,
		...approximateSize({
			width: result.visibleArea.width,
			height: result.visibleArea.height,
			aspectRatio: {
				minimum: ratio(result.boundary),
				maximum: ratio(result.boundary),
			},
			sizeRestrictions: {
				maxWidth: areaSizeRestrictions.maxWidth,
				maxHeight: areaSizeRestrictions.maxHeight,
				minHeight: areaSizeRestrictions.minHeight,
				minWidth: areaSizeRestrictions.minWidth,
			},
		}),
	};

	// Return the visible area to previous center
	result.visibleArea = applyMove(
		result.visibleArea,
		diff(getCenter(state.visibleArea), getCenter(result.visibleArea)),
	);

	// Fit the visible area to positions restrictions
	result.visibleArea = moveToPositionRestrictions(result.visibleArea, getAreaPositionRestrictions(result, settings));

	return result;
}
