import { CropperSettings, CropperState, MoveDirections } from '../types';
import { copyState } from './copyState';
import {
	applyMove,
	mergePositionRestrictions,
	moveToPositionRestrictions,
	coordinatesToPositionRestrictions,
	getPositionRestrictions,
	isInitialized,
} from '../service';

export type MoveAlgorithm = (
	state: CropperState,
	settings: CropperSettings,
	directions: MoveDirections,
) => CropperState;

export function moveCoordinates(state: CropperState, settings: CropperSettings, directions: MoveDirections) {
	if (isInitialized(state)) {
		const result = copyState(state);

		result.coordinates = applyMove(result.coordinates, directions);
		result.coordinates = moveToPositionRestrictions(
			result.coordinates,
			mergePositionRestrictions(
				coordinatesToPositionRestrictions(result.visibleArea),
				getPositionRestrictions(result, settings),
			),
		);
		return result;
	}

	return state;
}
