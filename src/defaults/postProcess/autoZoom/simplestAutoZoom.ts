import { CropperSettings, CropperState, PostprocessAction } from '../../../types';
import { applyScale, fitVisibleArea, getAreaSizeRestrictions, isInitialized, maxScale } from '../../../service';
import { copyState } from '../../../state';

export function simplestAutoZoomAlgorithm(state: CropperState, settings: CropperSettings): CropperState {
	if (isInitialized(state)) {
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

export function simplestAutoZoom(
	state: CropperState,
	settings: CropperSettings,
	action: PostprocessAction,
): CropperState {
	if (action && action.name === 'setCoordinates') {
		return simplestAutoZoomAlgorithm(state, settings);
	}

	return state;
}
