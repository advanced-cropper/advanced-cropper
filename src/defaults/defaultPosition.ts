import { CropperState } from '../types';
import { getTransformedImageSize } from '../service';

export function defaultPosition(state: CropperState) {
	const { visibleArea, coordinates } = state;
	const area = visibleArea || getTransformedImageSize(state);

	return {
		left: (visibleArea ? visibleArea.left : 0) + area.width / 2 - (coordinates ? coordinates.width / 2 : 0),
		top: (visibleArea ? visibleArea.top : 0) + area.height / 2 - (coordinates ? coordinates.height / 2 : 0),
	};
}
