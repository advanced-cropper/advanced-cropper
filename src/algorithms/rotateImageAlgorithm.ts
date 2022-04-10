import {
	applyMove,
	diff,
	moveToPositionRestrictions,
	resizeToSizeRestrictions,
	getCenter,
	rotatePoint,
	getTransformedImageSize,
	getAspectRatio,
	getPositionRestrictions,
	getSizeRestrictions,
	getAreaSizeRestrictions,
	getAreaPositionRestrictions,
	approximateSize,
	isInitializedState,
} from '../service';
import { copyState } from '../state';
import { CropperSettings, CropperState, Rotate } from '../types';
import { mergeSizeRestrictions } from '../service';
import { isNumber } from '../utils';

export type RotateImageAlgorithm = (
	state: CropperState,
	settings: CropperSettings,
	rotate: number | Rotate,
) => CropperState;

export function rotateImageAlgorithm(state: CropperState, settings: CropperSettings, rotate: number | Rotate) {
	if (isInitializedState(state)) {
		const result = copyState(state);

		const angle = isNumber(rotate) ? rotate : rotate.angle;

		const imageCenter = rotatePoint(
			getCenter({
				left: 0,
				top: 0,
				...getTransformedImageSize(state),
			}),
			angle,
		);

		result.transforms.rotate += angle;

		result.coordinates = {
			...approximateSize({
				sizeRestrictions: getSizeRestrictions(result, settings),
				aspectRatio: getAspectRatio(result, settings),
				width: result.coordinates.width,
				height: result.coordinates.height,
			}),
			...rotatePoint(getCenter(result.coordinates), angle),
		};

		const center = !isNumber(rotate) && rotate.center ? rotate.center : getCenter(state.coordinates);

		const shift = diff(getCenter(state.coordinates), rotatePoint(getCenter(state.coordinates), angle, center));

		const imageSize = getTransformedImageSize(result);

		result.coordinates.left -= imageCenter.left - imageSize.width / 2 + result.coordinates.width / 2 - shift.left;
		result.coordinates.top -= imageCenter.top - imageSize.height / 2 + result.coordinates.height / 2 - shift.top;

		// Check that visible area doesn't break the area restrictions:
		result.visibleArea = resizeToSizeRestrictions(
			result.visibleArea,
			mergeSizeRestrictions(getAreaSizeRestrictions(result, settings), {
				minWidth: result.coordinates.width,
				minHeight: result.coordinates.height,
			}),
		);

		result.coordinates = moveToPositionRestrictions(result.coordinates, getPositionRestrictions(result, settings));

		result.visibleArea = applyMove(
			result.visibleArea,
			diff(getCenter(result.coordinates), getCenter(state.coordinates)),
		);

		result.visibleArea = moveToPositionRestrictions(
			result.visibleArea,
			getAreaPositionRestrictions(result, settings),
		);
		return result;
	}
	return state;
}
