import { CropperSettings, CropperState } from '../types';
import { applyMove, diff, moveToPositionRestrictions, getCenter, rotatePoint } from '../service/utils';
import { getAreaPositionRestrictions, getTransformedImageSize } from '../service/helpers';
import { copyState } from './copyState';

export type FlipImageAlgorithm = (
	state: CropperState,
	settings: CropperSettings,
	horizontal?: boolean,
	vertical?: boolean,
) => CropperState;

export function flipImage(state: CropperState, settings: CropperSettings, horizontal?: boolean, vertical?: boolean) {
	const result = copyState(state);

	const rotate = state.transforms.rotate;

	const imageSize = getTransformedImageSize(state);

	const changed = {
		horizontal,
		vertical,
	};

	if (changed.horizontal || changed.vertical) {
		const imageCenter = rotatePoint(
			{
				left: imageSize.width / 2,
				top: imageSize.height / 2,
			},
			-rotate,
		);

		let oldCenter = rotatePoint(getCenter(result.coordinates), -rotate);
		let newCenter = rotatePoint(
			{
				left: changed.horizontal ? imageCenter.left - (oldCenter.left - imageCenter.left) : oldCenter.left,
				top: changed.vertical ? imageCenter.top - (oldCenter.top - imageCenter.top) : oldCenter.top,
			},
			rotate,
		);
		result.coordinates = applyMove(result.coordinates, diff(newCenter, getCenter(result.coordinates)));

		oldCenter = rotatePoint(getCenter(result.visibleArea), -rotate);
		newCenter = rotatePoint(
			{
				left: changed.horizontal ? imageCenter.left - (oldCenter.left - imageCenter.left) : oldCenter.left,
				top: changed.vertical ? imageCenter.top - (oldCenter.top - imageCenter.top) : oldCenter.top,
			},
			rotate,
		);
		result.visibleArea = applyMove(result.visibleArea, diff(newCenter, getCenter(result.visibleArea)));

		result.visibleArea = moveToPositionRestrictions(
			result.visibleArea,
			getAreaPositionRestrictions(result, settings),
		);
	}

	if (changed.horizontal) {
		result.transforms.flip.horizontal = !state.transforms.flip.horizontal;
	}

	if (changed.vertical) {
		result.transforms.flip.vertical = !state.transforms.flip.vertical;
	}

	return result;
}
