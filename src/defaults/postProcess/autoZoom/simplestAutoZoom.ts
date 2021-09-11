import { CropperSettings, CropperState } from '../../../types';
import { applyScale, fitVisibleArea, getAreaSizeRestrictions, maxScale } from '../../../service';
import { copyState } from '../../../state';

export function simplestAutoZoomAlgorithm(state: CropperState, settings: CropperSettings): CropperState {
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

export function simplestAutoZoom(state: CropperState, settings: CropperSettings, action: string): CropperState {
	if (action === 'setCoordinates') {
		return simplestAutoZoomAlgorithm(state, settings);
	}

	return state;
}
