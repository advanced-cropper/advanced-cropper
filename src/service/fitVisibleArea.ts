import { applyMove, diff, moveToPositionRestrictions, getCenter, ratio } from './utils';
import { CropperSettings, CropperState } from '../types';
import { getAreaPositionRestrictions, getAreaSizeRestrictions } from './helpers';
import { copyState } from '../state';
import { approximateSize } from './approximateSize';

export function fitVisibleArea(state: CropperState, settings: CropperSettings) {
	const result = copyState(state);

	if (state.visibleArea) {
		const areaSizeRestrictions = getAreaSizeRestrictions(state, settings);

		// Fit the visible area to its size restrictions and boundary aspect ratio:
		result.visibleArea = {
			...state.visibleArea,
			...approximateSize({
				width: state.visibleArea.width,
				height: state.visibleArea.height,
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
		result.visibleArea = moveToPositionRestrictions(
			result.visibleArea,
			getAreaPositionRestrictions(result, settings),
		);
	}

	return result;
}
