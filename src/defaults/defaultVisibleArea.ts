import { CropperSettings, CropperState, Limits } from '../types';
import { getAreaSizeRestrictions, getTransformedImageSize } from '../service';
import { getIntersections, moveToPositionRestrictions, ratio, resizeToSizeRestrictions, toLimits } from '../service';

export function defaultVisibleArea(state: CropperState, settings: CropperSettings) {
	const { coordinates, boundary } = state;

	const imageSize = getTransformedImageSize(state);

	const boundaryRatio = ratio(boundary);

	if (coordinates) {
		// Visible area will try to fit reference:
		const reference = {
			height: Math.max(coordinates.height, imageSize.height),
			width: Math.max(coordinates.width, imageSize.width),
		};

		let visibleArea = {
			left: 0,
			top: 0,
			width: ratio(reference) > boundaryRatio ? reference.width : reference.height * boundaryRatio,
			height: ratio(reference) > boundaryRatio ? reference.width / boundaryRatio : reference.height,
		};

		// Visible area should correspond its restrictions:
		visibleArea = resizeToSizeRestrictions(visibleArea, getAreaSizeRestrictions(state, settings));

		// Visible area will try to center stencil:
		visibleArea.left = coordinates.left + coordinates.width / 2 - visibleArea.width / 2;
		visibleArea.top = coordinates.top + coordinates.height / 2 - visibleArea.height / 2;

		// TODO: Controversial behavior:
		// If the coordinates are beyond image visible area will be allowed to be beyond image alike:
		const coordinatesIntersection = getIntersections(
			coordinates,
			toLimits({
				left: 0,
				top: 0,
				...imageSize,
			}),
		);

		const limits: Limits = {};

		if (!coordinatesIntersection.left && !coordinatesIntersection.right && visibleArea.width <= imageSize.width) {
			limits.left = 0;
			limits.right = imageSize.width;
		}

		if (!coordinatesIntersection.top && !coordinatesIntersection.bottom && visibleArea.height <= imageSize.height) {
			limits.top = 0;
			limits.bottom = imageSize.height;
		}

		return moveToPositionRestrictions(visibleArea, limits);
	} else {
		const imageRatio = ratio(imageSize);

		const areaProperties = {
			height: imageRatio < boundaryRatio ? imageSize.height : imageSize.width / boundaryRatio,
			width: imageRatio < boundaryRatio ? imageSize.height * boundaryRatio : imageSize.width,
		};

		return {
			left: imageSize.width / 2 - areaProperties.width / 2,
			top: imageSize.height / 2 - areaProperties.height / 2,
			width: areaProperties.width,
			height: areaProperties.height,
		};
	}
}
