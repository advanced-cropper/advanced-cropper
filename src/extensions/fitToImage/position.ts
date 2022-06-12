import { getBoundingBox } from './boundingBox';
import { applyMove, fitToPositionRestrictions, getCenter, rotatePoint, rotateSize } from '../../service';
import { Coordinates } from '../../types';
import { BoundingBox, BoundingBoxType } from './types';

interface RotatedImage {
	width: number;
	height: number;
	angle: number;
}

export function fitToImage(
	coordinates: Coordinates,
	image: RotatedImage,
	boundingBox: BoundingBox = BoundingBoxType.Rectangle,
) {
	const imageCenter = getCenter({
		left: 0,
		top: 0,
		...rotateSize(image, -image.angle),
	});

	const center = rotatePoint(getCenter(coordinates), -image.angle, imageCenter);

	const boundingBoxSize = getBoundingBox(coordinates, image.angle, boundingBox);

	const boundingBoxCoordinates = {
		...boundingBoxSize,
		left: center.left - boundingBoxSize.width / 2,
		top: center.top - boundingBoxSize.height / 2,
	};

	const vector = fitToPositionRestrictions(boundingBoxCoordinates, {
		left: imageCenter.left - image.width / 2,
		top: imageCenter.top - image.height / 2,
		right: imageCenter.left + image.width / 2,
		bottom: imageCenter.top + image.height / 2,
	});

	const leftVector = rotatePoint({ left: vector.left, top: 0 }, image.angle);

	const topVector = rotatePoint({ left: 0, top: vector.top }, image.angle);

	return {
		left: leftVector.left + topVector.left,
		top: leftVector.top + topVector.top,
	};
}

export function moveToImage(
	coordinates: Coordinates,
	image: RotatedImage,
	boundingBox: BoundingBox = BoundingBoxType.Rectangle,
) {
	return applyMove(coordinates, fitToImage(coordinates, image, boundingBox));
}
