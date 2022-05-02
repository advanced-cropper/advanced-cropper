import { CoreSettings, CropperState, MoveDirections } from '../types';
import { copyState } from './copyState';
import {
	applyMove,
	mergePositionRestrictions,
	moveToPositionRestrictions,
	coordinatesToPositionRestrictions,
	getPositionRestrictions,
	isInitializedState,
} from '../service';

export type MoveAlgorithm<Settings extends CoreSettings = CoreSettings> = (
	state: CropperState,
	settings: Settings,
	directions: MoveDirections,
) => CropperState;

export function moveCoordinates<Settings extends CoreSettings>(
	state: CropperState,
	settings: Settings,
	directions: MoveDirections,
) {
	if (isInitializedState(state)) {
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
