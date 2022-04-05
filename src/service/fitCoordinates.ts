import { applyMove, diff, getCenter, mergePositionRestrictions, moveToPositionRestrictions, toLimits } from './utils';
import { CropperSettings, CropperState } from '../types';
import { getAspectRatio, getPositionRestrictions, getSizeRestrictions } from './helpers';
import { copyState } from '../state';
import { approximateSize } from './approximateSize';

export function fitCoordinates(state: CropperState, settings: CropperSettings) {
	if (state.coordinates) {
		const result = copyState(state);

		const aspectRatio = getAspectRatio(state, settings);

		const sizeRestrictions = getSizeRestrictions(state, settings);

		// Fit the size of coordinates to existing size restrictions and visible area
		result.coordinates = {
			...state.coordinates,
			...approximateSize({
				width: state.coordinates.width,
				height: state.coordinates.height,
				aspectRatio,
				sizeRestrictions: state.visibleArea
					? {
							maxWidth: Math.min(state.visibleArea.width, sizeRestrictions.maxWidth),
							maxHeight: Math.min(state.visibleArea.height, sizeRestrictions.maxHeight),
							minHeight: Math.min(state.visibleArea.height, sizeRestrictions.minHeight),
							minWidth: Math.min(state.visibleArea.width, sizeRestrictions.minWidth),
					  }
					: sizeRestrictions,
			}),
		};

		// Return the coordinates to the previous center
		result.coordinates = applyMove(
			result.coordinates,
			diff(getCenter(state.coordinates), getCenter(result.coordinates)),
		);

		// Fit the coordinates to position restrictions and visible area
		result.coordinates = moveToPositionRestrictions(
			result.coordinates,
			state.visibleArea
				? mergePositionRestrictions(toLimits(state.visibleArea), getPositionRestrictions(result, settings))
				: getPositionRestrictions(result, settings),
		);
		return result;
	}

	return state;
}
