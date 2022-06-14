import { CoreSettings, CropperState, PostprocessAction } from '../types';
import {
	applyScale,
	fitVisibleArea,
	getAreaSizeRestrictions,
	isInitializedState,
	maxScale,
} from '../service';
import { copyState } from '../state';

export function defaultPostprocess(
	state: CropperState,
	settings: CoreSettings,
	action: PostprocessAction,
): CropperState {
	if (action && action.name === 'setCoordinates' && isInitializedState(state)) {
		const result = copyState(state);

		const widthIntersections = Math.max(0, result.coordinates.width - result.visibleArea.width);
		const heightIntersections = Math.max(0, result.coordinates.height - result.visibleArea.height);

		const areaSizeRestrictions = getAreaSizeRestrictions(state, settings);

		if (widthIntersections > heightIntersections) {
			result.visibleArea = applyScale(
				result.visibleArea,
				Math.min(
					result.coordinates.width / result.visibleArea.width,
					maxScale(result.visibleArea, areaSizeRestrictions),
				),
			);
		} else if (heightIntersections > widthIntersections) {
			result.visibleArea = applyScale(
				result.visibleArea,
				Math.min(
					result.coordinates.height / result.visibleArea.height,
					maxScale(result.visibleArea, areaSizeRestrictions),
				),
			);
		}
		return fitVisibleArea(result, settings);
	}

	return state;
}
