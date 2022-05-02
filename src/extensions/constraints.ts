import { CropperSettings, CropperState, PostprocessAction } from '../types';
import {
	applyScale,
	fitCoordinates,
	fitVisibleArea,
	getAreaPositionRestrictions,
	getAreaSizeRestrictions,
	getTransformedImageSize,
	isInitializedState,
	maxScale,
	moveToPositionRestrictions,
	ratio,
} from '../service';
import { copyState } from '../state';

export function setCoordinatesSafety(
	state: CropperState,
	settings: CropperSettings,
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

export function preventZoom(state: CropperState, settings: CropperSettings, action: PostprocessAction): CropperState {
	if (action && action.immediately && isInitializedState(state)) {
		const result = copyState(state);

		const imageSize = getTransformedImageSize(state);

		const restrictionsSize = getAreaSizeRestrictions(state, settings);

		const visibleAreaSize = {
			width: Math.max(Math.min(imageSize.width, restrictionsSize.maxWidth), restrictionsSize.minWidth),
			height: Math.max(Math.min(imageSize.height, restrictionsSize.maxHeight), restrictionsSize.minHeight),
		};

		if (ratio(result.boundary) > ratio(imageSize)) {
			result.visibleArea.height = visibleAreaSize.height;
			result.visibleArea.width = visibleAreaSize.height * ratio(result.boundary);
			result.visibleArea = moveToPositionRestrictions(
				result.visibleArea,
				getAreaPositionRestrictions(result, settings),
			);
		} else {
			result.visibleArea.width = visibleAreaSize.width;
			result.visibleArea.height = visibleAreaSize.width / ratio(result.boundary);
			result.visibleArea = moveToPositionRestrictions(
				result.visibleArea,
				getAreaPositionRestrictions(result, settings),
			);
		}

		return fitCoordinates(result, settings);
	}

	return state;
}
