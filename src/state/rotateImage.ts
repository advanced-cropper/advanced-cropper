import {
	applyMove,
	diff,
	moveToPositionRestrictions,
	resizeToSizeRestrictions,
	getCenter,
	rotatePoint,
} from '../service/utils';
import {
	getTransformedImageSize,
	getAspectRatio,
	getPositionRestrictions,
	getSizeRestrictions,
	getAreaSizeRestrictions,
	getAreaPositionRestrictions,
} from '../service/helpers';
import { copyState } from './copyState';
import { approximateSize } from '../service/approximateSize';
import { CropperSettings, CropperState } from '../types';
import { mergeSizeRestrictions } from '../service';

export type RotateImageAlgorithm = (state: CropperState, settings: CropperSettings, angle: number) => CropperState;

export function rotateImage(state: CropperState, settings: CropperSettings, angle: number) {
	const result = copyState(state);

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

	const imageSize = getTransformedImageSize(result);

	result.coordinates.left -= imageCenter.left - imageSize.width / 2 + result.coordinates.width / 2;
	result.coordinates.top -= imageCenter.top - imageSize.height / 2 + result.coordinates.height / 2;

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

	result.visibleArea = moveToPositionRestrictions(result.visibleArea, getAreaPositionRestrictions(result, settings));

	return result;
}
