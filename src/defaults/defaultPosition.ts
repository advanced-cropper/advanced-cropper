import { CropperSettings, CropperState } from '../types';
import { getTransformedImageSize } from '../service/helpers';

export function defaultPosition(state: CropperState, props: CropperSettings) {
	const { visibleArea, imageSize, coordinates } = state;
	const area = visibleArea || getTransformedImageSize(state);

	return {
		left: (visibleArea ? visibleArea.left : 0) + area.width / 2 - coordinates.width / 2,
		top: (visibleArea ? visibleArea.top : 0) + area.height / 2 - coordinates.height / 2,
	};
}
