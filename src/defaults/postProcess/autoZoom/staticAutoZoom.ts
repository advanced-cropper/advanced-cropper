import {
	fitCoordinates,
	getAreaPositionRestrictions,
	getAreaSizeRestrictions,
	getTransformedImageSize,
	isInitializedState,
	moveToPositionRestrictions,
	ratio,
} from '../../../service';
import { copyState } from '../../../state';
import { CropperSettings, CropperState, PostprocessAction } from '../../../types';

export function staticAutoZoom(
	state: CropperState,
	settings: CropperSettings,
	action?: PostprocessAction,
): CropperState {
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
