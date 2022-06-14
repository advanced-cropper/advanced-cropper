import { CoreSettings, CropperState } from '../types';
import {
	applyMove,
	approximateSize,
	coordinatesToPositionRestrictions,
	diff,
	getAreaPositionRestrictions,
	getAreaSizeRestrictions,
	getAspectRatio,
	getBrokenRatio,
	getCenter,
	getPositionRestrictions,
	getSizeRestrictions,
	isConsistentPosition,
	isConsistentSize,
	isInitializedState,
	mergePositionRestrictions,
	mergeSizeRestrictions,
	moveToPositionRestrictions,
	ratio,
} from '../service';
import { copyState } from './copyState';

export type ReconcileStateAlgorithm<Settings extends CoreSettings = CoreSettings> = (
	state: CropperState,
	settings: Settings,
) => CropperState;

export function reconcileState(state: CropperState, settings: CoreSettings) {
	if (isInitializedState(state)) {
		const result = copyState(state);

		const aspectRatio = getAspectRatio(state, settings);

		const sizeRestrictions = getSizeRestrictions(state, settings);

		const areaSizeRestrictions = getAreaSizeRestrictions(state, settings);

		// Fit the size of coordinates to existing size restrictions and visible area
		result.coordinates = {
			...state.coordinates,
			...approximateSize({
				width: state.coordinates.width,
				height: state.coordinates.height,
				aspectRatio,
				sizeRestrictions: mergeSizeRestrictions(areaSizeRestrictions, sizeRestrictions),
			}),
		};

		// Return the coordinates to the previous center
		result.coordinates = applyMove(
			result.coordinates,
			diff(getCenter(state.coordinates), getCenter(result.coordinates)),
		);

		const scaleModifier = Math.max(
			result.coordinates.width / state.coordinates.width,
			result.coordinates.height / state.coordinates.height,
		);

		// Fit the visible area to its size restrictions and boundary aspect ratio:
		result.visibleArea = {
			...state.visibleArea,
			...approximateSize({
				width: state.visibleArea.width * scaleModifier,
				height: state.visibleArea.height * scaleModifier,
				aspectRatio: {
					minimum: ratio(result.boundary),
					maximum: ratio(result.boundary),
				},
				sizeRestrictions: areaSizeRestrictions,
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

		// Fit the coordinates to position restrictions and visible area
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

export function isConsistentState(state: CropperState, settings: CoreSettings) {
	if (isInitializedState(state)) {
		return (
			!getBrokenRatio(ratio(state.coordinates), getAspectRatio(state, settings)) &&
			isConsistentSize(state.visibleArea, getAreaSizeRestrictions(state, settings)) &&
			isConsistentSize(state.coordinates, getSizeRestrictions(state, settings)) &&
			isConsistentPosition(state.visibleArea, getAreaPositionRestrictions(state, settings)) &&
			isConsistentPosition(state.coordinates, getPositionRestrictions(state, settings))
		);
	} else {
		return true;
	}
}
