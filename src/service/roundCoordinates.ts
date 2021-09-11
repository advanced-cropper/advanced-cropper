import { Coordinates, CropperSettings, CropperState } from '../types';
import { moveToPositionRestrictions } from './utils';
import { getPositionRestrictions, getSizeRestrictions } from './helpers';

export function roundCoordinates(state: CropperState, settings: CropperSettings): Coordinates {
	const { coordinates } = state;

	const sizeRestrictions = getSizeRestrictions(state, settings);

	const positionRestrictions = getPositionRestrictions(state, settings);

	const roundCoordinates = {
		width: Math.round(coordinates.width),
		height: Math.round(coordinates.height),
		left: Math.round(coordinates.left),
		top: Math.round(coordinates.top),
	};

	if (roundCoordinates.width > sizeRestrictions.maxWidth) {
		roundCoordinates.width = Math.floor(coordinates.width);
	} else if (roundCoordinates.width < sizeRestrictions.minWidth) {
		roundCoordinates.width = Math.ceil(coordinates.width);
	}
	if (roundCoordinates.height > sizeRestrictions.maxHeight) {
		roundCoordinates.height = Math.floor(coordinates.height);
	} else if (roundCoordinates.height < sizeRestrictions.minHeight) {
		roundCoordinates.height = Math.ceil(coordinates.height);
	}

	return moveToPositionRestrictions(roundCoordinates, positionRestrictions);
}
