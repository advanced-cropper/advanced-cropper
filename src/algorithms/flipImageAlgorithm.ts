import { CoreSettings, CropperState } from '../types';
import {
	applyMove,
	diff,
	moveToPositionRestrictions,
	getCenter,
	rotatePoint,
	getAreaPositionRestrictions,
	getTransformedImageSize,
	isInitializedState,
} from '../service';
import { copyState } from '../state';

export function flipImageAlgorithm(
	state: CropperState,
	settings: CoreSettings,
	horizontal?: boolean,
	vertical?: boolean,
) {
	if (isInitializedState(state)) {
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
	return state;
}
