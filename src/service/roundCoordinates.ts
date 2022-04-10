import { Coordinates, CropperSettings, CropperState } from '../types';
import { moveToPositionRestrictions } from './utils';
import { getPositionRestrictions, getSizeRestrictions, isInitializedState } from './helpers';

export function roundCoordinates(state: CropperState, settings: CropperSettings): Coordinates | null {
	if (isInitializedState(state)) {
		const sizeRestrictions = getSizeRestrictions(state, settings);

		const positionRestrictions = getPositionRestrictions(state, settings);

		const roundCoordinates = {
			width: Math.round(state.coordinates.width),
			height: Math.round(state.coordinates.height),
			left: Math.round(state.coordinates.left),
			top: Math.round(state.coordinates.top),
		};

		if (roundCoordinates.width > sizeRestrictions.maxWidth) {
			roundCoordinates.width = Math.floor(state.coordinates.width);
		} else if (roundCoordinates.width < sizeRestrictions.minWidth) {
			roundCoordinates.width = Math.ceil(state.coordinates.width);
		}
		if (roundCoordinates.height > sizeRestrictions.maxHeight) {
			roundCoordinates.height = Math.floor(state.coordinates.height);
		} else if (roundCoordinates.height < sizeRestrictions.minHeight) {
			roundCoordinates.height = Math.ceil(state.coordinates.height);
		}

		return moveToPositionRestrictions(roundCoordinates, positionRestrictions);
	} else {
		return null;
	}
}
