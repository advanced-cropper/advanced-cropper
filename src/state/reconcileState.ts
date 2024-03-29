import { CoreSettings, CropperState, Size } from '../types';
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
		const brokenRatio = getBrokenRatio(ratio(state.coordinates), aspectRatio);
		const desiredSize: Size = brokenRatio
			? {
					height: state.coordinates.height,
					width: state.coordinates.height * brokenRatio,
			  }
			: state.coordinates;

		result.coordinates = {
			...result.coordinates,
			...approximateSize({
				width: desiredSize.width,
				height: desiredSize.height,
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
			result.coordinates.width / result.visibleArea.width,
			result.coordinates.height / result.visibleArea.height,
			1,
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
