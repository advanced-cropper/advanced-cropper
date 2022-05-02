import {
	CropperState,
	CropperSettings,
	ImageTransform,
	InitializedCropperState,
	CropperBehaviorSettings,
} from '../types';
import {
	applyMove,
	applyScale,
	fitToPositionRestrictions,
	getCenter,
	mergePositionRestrictions,
	inverseMove,
	maxScale,
	minScale,
	moveToPositionRestrictions,
	positionToSizeRestrictions,
	coordinatesToPositionRestrictions,
	getAreaPositionRestrictions,
	getAreaSizeRestrictions,
	getPositionRestrictions,
	getSizeRestrictions,
	isInitializedState,
} from '../service';
import { copyState } from '../state';
import { isNumber, isRoughlyEqual } from '../utils';

export function transformImageAlgorithm(
	state: CropperState,
	settings: CropperSettings & CropperBehaviorSettings,
	transform: ImageTransform,
): CropperState {
	const { scale = 1, move = {} } = transform;

	if (isInitializedState(state)) {
		const result = copyState(state) as InitializedCropperState;

		// It's reversed because zooming in the image is actually zooming out visible area
		const scaleFactor = 1 / (isNumber(scale) ? scale : scale.factor);

		const scaleCenter = !isNumber(scale) ? scale.center : undefined;

		const isAllowedScale = !isRoughlyEqual(scaleFactor, 1);

		let areaScale = 1;
		let stencilScale = 1;

		result.visibleArea = applyMove(result.visibleArea, {
			left: move.left || 0,
			top: move.top || 0,
		});

		const sizeRestrictions = getSizeRestrictions(result, settings);

		const positionRestrictions = getPositionRestrictions(result, settings);

		const areaSizeRestrictions = getAreaSizeRestrictions(result, settings);

		const scaleRestrictions = {
			stencil: {
				minimum: Math.max(
					sizeRestrictions.minWidth ? sizeRestrictions.minWidth / result.coordinates.width : 0,
					sizeRestrictions.minHeight ? sizeRestrictions.minHeight / result.coordinates.height : 0,
				),
				maximum: Math.min(
					sizeRestrictions.maxWidth ? sizeRestrictions.maxWidth / result.coordinates.width : Infinity,
					sizeRestrictions.maxHeight ? sizeRestrictions.maxHeight / result.coordinates.height : Infinity,
					maxScale(result.coordinates, positionToSizeRestrictions(positionRestrictions)),
				),
			},
			area: {
				maximum: maxScale(result.visibleArea, areaSizeRestrictions),
				minimum: minScale(result.visibleArea, areaSizeRestrictions),
			},
		};

		// If there is scaling then begin scale
		if (scaleFactor && isAllowedScale) {
			// Determine scale factor
			if (scaleFactor < 1) {
				stencilScale = Math.max(
					scaleFactor,
					Math.max(scaleRestrictions.area.minimum, scaleRestrictions.stencil.minimum),
				);
				if (stencilScale > 1) {
					stencilScale = 1;
				}
			} else if (scaleFactor > 1) {
				stencilScale = Math.min(
					scaleFactor,
					Math.min(scaleRestrictions.area.maximum, scaleRestrictions.stencil.maximum),
				);
				if (stencilScale < 1) {
					stencilScale = 1;
				}
			}
		}

		if (stencilScale) {
			// Resize stencil with area as much as possible
			result.visibleArea = applyScale(result.visibleArea, stencilScale, scaleCenter);
		}

		const relativeCoordinates = {
			left: state.coordinates.left - state.visibleArea.left,
			right:
				state.visibleArea.width + state.visibleArea.left - (state.coordinates.width + state.coordinates.left),
			top: state.coordinates.top - state.visibleArea.top,
			bottom:
				state.visibleArea.height + state.visibleArea.top - (state.coordinates.height + state.coordinates.top),
		};

		// Move the area to fit to coordinates limits:
		result.visibleArea = moveToPositionRestrictions(result.visibleArea, {
			left:
				positionRestrictions.left !== undefined
					? positionRestrictions.left - relativeCoordinates.left * stencilScale
					: undefined,
			top:
				positionRestrictions.top !== undefined
					? positionRestrictions.top - relativeCoordinates.top * stencilScale
					: undefined,
			bottom:
				positionRestrictions.bottom !== undefined
					? positionRestrictions.bottom + relativeCoordinates.bottom * stencilScale
					: undefined,
			right:
				positionRestrictions.right !== undefined
					? positionRestrictions.right + relativeCoordinates.right * stencilScale
					: undefined,
		});

		// But the more important to fit are to the area restrictions, so we should fit it to that restrictions:
		result.visibleArea = moveToPositionRestrictions(
			result.visibleArea,
			getAreaPositionRestrictions(result, settings),
		);

		// Set the same coordinates of stencil inside visible area
		result.coordinates.width = result.coordinates.width * stencilScale;
		result.coordinates.height = result.coordinates.height * stencilScale;
		result.coordinates.left = result.visibleArea.left + relativeCoordinates.left * stencilScale;
		result.coordinates.top = result.visibleArea.top + relativeCoordinates.top * stencilScale;

		// Move the coordinates to prevent the intersection with visible area and position restrictions
		result.coordinates = moveToPositionRestrictions(
			result.coordinates,
			mergePositionRestrictions(coordinatesToPositionRestrictions(result.visibleArea), positionRestrictions),
		);

		// Resize only area if stencil can't be resized and stencil resize is disabled
		if (isAllowedScale && scaleFactor && settings.transformImage?.adjustStencil) {
			if (scaleFactor > 1) {
				areaScale = Math.min(scaleRestrictions.area.maximum, scaleFactor) / stencilScale;
			} else if (scaleFactor < 1) {
				areaScale = Math.max(
					result.coordinates.height / result.visibleArea.height,
					result.coordinates.width / result.visibleArea.width,
					scaleFactor / stencilScale,
				);
			}
			if (areaScale !== 1) {
				result.visibleArea = applyScale(
					result.visibleArea,
					areaScale,
					scaleFactor > 1 ? scaleCenter : getCenter(result.coordinates),
				);

				// Move to prevent the breaking of the area restrictions:
				result.visibleArea = moveToPositionRestrictions(
					result.visibleArea,
					getAreaPositionRestrictions(result, settings),
				);

				// Move to prevent the intersection with coordinates:
				result.visibleArea = applyMove(
					result.visibleArea,
					inverseMove(
						fitToPositionRestrictions(
							result.coordinates,
							coordinatesToPositionRestrictions(result.visibleArea),
						),
					),
				);
			}
		}
		return result;
	}
	return state;
}
