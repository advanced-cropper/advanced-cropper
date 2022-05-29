import { BoundingBox, getBoundingBox } from './boundingBox';
import { fitToPositionRestrictions, getCenter, rotatePoint, rotateSize } from '../../service';
import { isNumber, isUndefined } from '../../utils';
import { Point, Coordinates } from '../../types';

interface RotatedImage {
	width: number;
	height: number;
	angle: number;
}

function min<T>(array: T[]) {
	return array.reduce<T>((result, el) => {
		if (isNumber(el) && (isUndefined(result) || el < result)) {
			return el;
		} else {
			return result;
		}
		// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
		// @ts-ignore
	}, undefined);
}

function max<T>(array: T[]) {
	return array.reduce<T>((result, el) => {
		if (isNumber(el) && (isUndefined(result) || el > result)) {
			return el;
		} else {
			return result;
		}
		// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
		// @ts-ignore
	}, undefined);
}

export function fitPolygonToImage(points: Point[], image: RotatedImage) {
	const size = rotateSize(image, image.angle);

	const center = {
		left: size.width / 2,
		top: size.height / 2,
	};

	const box = {
		left: center.left - image.width / 2,
		top: center.top - image.height / 2,
		height: image.height,
		width: image.width,
	};

	const intersections = {
		left: max(
			points.map((point) => {
				if (point.left < box.left) {
					return box.left - point.left;
				}
			}),
		),
		right: min(
			points.map((point) => {
				if (point.left > box.left + box.width) {
					return box.left + box.width - point.left;
				}
			}),
		),
		bottom: max(
			points.map((point) => {
				if (point.top < box.top) {
					return box.top - point.top;
				}
			}),
		),
		top: min(
			points.map((point) => {
				if (point.top > box.top + box.height) {
					return box.top + box.height - point.top;
				}
			}),
		),
	};

	const leftVector = rotatePoint({ left: intersections.left || intersections.right || 0, top: 0 }, image.angle);

	const topVector = rotatePoint({ left: 0, top: intersections.top || intersections.bottom || 0 }, image.angle);

	return {
		left: leftVector.left + topVector.left,
		top: leftVector.top + topVector.top,
	};
}

export function fitRectangleToImage(coordinates: Coordinates, image: RotatedImage) {
	const size = rotateSize(image, image.angle);

	const center = {
		left: size.width / 2,
		top: size.height / 2,
	};

	const points = [
		{ left: coordinates.left, top: coordinates.top },
		{ left: coordinates.left + coordinates.width, top: coordinates.top },
		{ left: coordinates.left + coordinates.width, top: coordinates.top + coordinates.height },
		{ left: coordinates.left, top: coordinates.top + coordinates.height },
	].map((point) => rotatePoint(point, -image.angle, center));

	return fitPolygonToImage(points, image);
}

export function fitCircleToImage(coordinates: Coordinates, image: RotatedImage) {
	const size = rotateSize(image, image.angle);

	const imageCenter = {
		left: size.width / 2,
		top: size.height / 2,
	};

	const center = rotatePoint(
		{
			left: coordinates.left + coordinates.width / 2,
			top: coordinates.top + coordinates.height / 2,
		},
		-image.angle,
		imageCenter,
	);

	const points = [
		{ left: center.left - coordinates.width / 2, top: center.top - coordinates.height / 2 },
		{ left: center.left + coordinates.width / 2, top: center.top - coordinates.height / 2 },
		{ left: center.left + coordinates.width / 2, top: center.top + coordinates.height / 2 },
		{ left: center.left - coordinates.width / 2, top: center.top + coordinates.height / 2 },
	];

	return fitPolygonToImage(points, image);
}

export function fitPositionToImage(coordinates: Coordinates, image: RotatedImage, boundingBox: BoundingBox) {
	const center = getCenter(coordinates);

	const boundingBoxSize = getBoundingBox(coordinates, image.angle, boundingBox);

	const boundingBoxCoordinates = {
		left: center.left - boundingBoxSize.width / 2,
		top: center.top - boundingBoxSize.height / 2,
		...boundingBoxSize,
	};

	const vector = fitToPositionRestrictions(boundingBoxCoordinates, {
		left: 0,
		top: 0,
		right: image.width,
		bottom: image.height,
	});

	const leftVector = rotatePoint({ left: vector.left, top: 0 }, image.angle);

	const topVector = rotatePoint({ left: 0, top: vector.top }, image.angle);

	return {
		...coordinates,
		left: leftVector.left + topVector.left,
		top: leftVector.top + topVector.top,
	};
}
