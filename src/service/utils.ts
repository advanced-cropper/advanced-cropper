import {
	AspectRatio,
	Coordinates,
	Diff,
	Intersections,
	Limits,
	MoveDirections,
	Point,
	PositionRestrictions,
	ResizeDirections,
	Size,
	SizeRestrictions,
} from '../types';
import { ALL_DIRECTIONS } from '../constants';
import { isUndefined } from '../utils';

export function toLimits(object: Coordinates): Limits {
	return {
		left: object.left,
		top: object.top,
		right: object.left + object.width,
		bottom: object.top + object.height,
	};
}

export function diff(firstObject: Point, secondObject: Point): Diff {
	return {
		left: firstObject.left - secondObject.left,
		top: firstObject.top - secondObject.top,
	};
}

export function sizeDistance(a: Size, b: Size): number {
	return Math.pow(a.width - b.width, 2) + Math.pow(a.height - b.height, 2);
}

export function getCenter(object: Coordinates): Point {
	return {
		left: object.left + object.width / 2,
		top: object.top + object.height / 2,
	};
}

export function getIntersections(object: Coordinates, limits: Limits): Intersections {
	const intersections: Intersections = {
		left: 0,
		top: 0,
		right: 0,
		bottom: 0,
	};
	ALL_DIRECTIONS.forEach((direction) => {
		const areaLimit = limits[direction];
		const objectLimit = toLimits(object)[direction];
		if (areaLimit !== undefined && objectLimit !== undefined) {
			if (direction === 'left' || direction === 'top') {
				intersections[direction] = Math.max(0, areaLimit - objectLimit);
			} else {
				intersections[direction] = Math.max(0, objectLimit - areaLimit);
			}
		} else {
			intersections[direction] = 0;
		}
	});
	return intersections;
}

export function applyDirections(coordinates: Coordinates, directions: ResizeDirections): Coordinates {
	return {
		left: coordinates.left - directions.left,
		top: coordinates.top - directions.top,
		width: coordinates.width + directions.left + directions.right,
		height: coordinates.height + directions.top + directions.bottom,
	};
}

export function inverseMove(directions: MoveDirections): MoveDirections {
	return {
		left: -directions.left,
		top: -directions.top,
	};
}

export function applyMove(object: Coordinates, move: MoveDirections): Coordinates {
	return {
		...object,
		left: object.left + move.left,
		top: object.top + move.top,
	};
}

export function applyScale(object: Coordinates, factor: number, center?: Point, progress?: number): Coordinates;
export function applyScale(object: Size, factor: number): Size;
export function applyScale(
	object: Coordinates | Size,
	factor: number,
	center?: Point,
	progress?: number,
): Coordinates | Size {
	if (factor !== 1) {
		if ('left' in object || 'top' in object) {
			if (center) {
				const currentCenter = getCenter(object);
				return {
					width: object.width * factor,
					height: object.height * factor,
					left:
						object.left +
						(object.width * (1 - factor)) / 2 +
						(center.left - currentCenter.left) * (progress || 1 - factor),
					top:
						object.top +
						(object.height * (1 - factor)) / 2 +
						(center.top - currentCenter.top) * (progress || 1 - factor),
				};
			} else {
				return {
					width: object.width * factor,
					height: object.height * factor,
					left: object.left + (object.width * (1 - factor)) / 2,
					top: object.top + (object.height * (1 - factor)) / 2,
				};
			}
		} else {
			return {
				width: object.width * factor,
				height: object.height * factor,
			};
		}
	} else {
		return object;
	}
}

export function ratio(object: Size): number {
	return object.width / object.height;
}

export function maxScale(size: Size, restrictions: SizeRestrictions): number {
	return Math.min(
		restrictions.maxWidth ? restrictions.maxWidth / size.width : Infinity,
		restrictions.maxHeight ? restrictions.maxHeight / size.height : Infinity,
	);
}

export function minScale(size: Size, restrictions: SizeRestrictions): number {
	return Math.max(
		restrictions.minWidth ? restrictions.minWidth / size.width : 0,
		restrictions.minHeight ? restrictions.minHeight / size.height : 0,
	);
}

export function getBrokenRatio(currentAspectRatio: number, aspectRatio: AspectRatio): number | undefined {
	let ratioBroken;
	if (aspectRatio.minimum && currentAspectRatio < aspectRatio.minimum) {
		ratioBroken = aspectRatio.minimum;
	} else if (aspectRatio.maximum && currentAspectRatio > aspectRatio.maximum) {
		ratioBroken = aspectRatio.maximum;
	}
	return ratioBroken;
}
export function fitToSizeRestrictions(coordinates: Size, sizeRestrictions: SizeRestrictions) {
	const aspectRatio = ratio(coordinates);

	let scale = 1;

	if (sizeRestrictions.minWidth > 0 && sizeRestrictions.minHeight > 0) {
		if (aspectRatio > sizeRestrictions.minWidth / sizeRestrictions.minHeight) {
			if (coordinates.height < sizeRestrictions.minHeight) {
				scale = sizeRestrictions.minHeight / coordinates.height;
			}
		} else {
			if (coordinates.width < sizeRestrictions.minWidth) {
				scale = sizeRestrictions.minWidth / coordinates.width;
			}
		}
	} else if (sizeRestrictions.minWidth > 0) {
		if (coordinates.width < sizeRestrictions.minWidth) {
			scale = sizeRestrictions.minWidth / coordinates.width;
		}
	} else if (sizeRestrictions.minHeight > 0) {
		if (coordinates.height < sizeRestrictions.minHeight) {
			scale = sizeRestrictions.minHeight / coordinates.height;
		}
	}

	if (sizeRestrictions.maxWidth < Infinity && sizeRestrictions.maxHeight < Infinity) {
		if (aspectRatio > sizeRestrictions.maxWidth / sizeRestrictions.maxHeight) {
			if (coordinates.width > sizeRestrictions.maxWidth) {
				scale = sizeRestrictions.maxWidth / coordinates.width;
			}
		} else {
			if (coordinates.height > sizeRestrictions.maxHeight) {
				scale = sizeRestrictions.maxHeight / coordinates.height;
			}
		}
	} else if (sizeRestrictions.maxWidth < Infinity) {
		if (coordinates.width > sizeRestrictions.maxWidth) {
			scale = sizeRestrictions.maxWidth / coordinates.width;
		}
	} else if (sizeRestrictions.maxHeight < Infinity) {
		if (coordinates.height > sizeRestrictions.maxHeight) {
			scale = sizeRestrictions.maxHeight / coordinates.height;
		}
	}
	return scale;
}

export function resizeToSizeRestrictions(coordinates: Coordinates, sizeRestrictions: SizeRestrictions): Coordinates;
export function resizeToSizeRestrictions(coordinates: Size, sizeRestrictions: SizeRestrictions): Size;
export function resizeToSizeRestrictions(coordinates: Coordinates | Size, sizeRestrictions: SizeRestrictions) {
	return applyScale(coordinates, fitToSizeRestrictions(coordinates, sizeRestrictions));
}

export function rotateSize(size: Size, angle: number) {
	const radians = (angle * Math.PI) / 180;
	return {
		width: Math.abs(size.width * Math.cos(radians)) + Math.abs(size.height * Math.sin(radians)),
		height: Math.abs(size.width * Math.sin(radians)) + Math.abs(size.height * Math.cos(radians)),
	};
}

export function rotatePoint(point: Point, angle: number, anchor?: Point) {
	const radians = (angle * Math.PI) / 180;
	if (anchor) {
		return {
			left:
				(point.left - anchor.left) * Math.cos(radians) -
				(point.top - anchor.top) * Math.sin(radians) +
				anchor.left,
			top:
				(point.left - anchor.left) * Math.sin(radians) +
				(point.top - anchor.top) * Math.cos(radians) +
				anchor.top,
		};
	} else {
		return {
			left: point.left * Math.cos(radians) - point.top * Math.sin(radians),
			top: point.left * Math.sin(radians) + point.top * Math.cos(radians),
		};
	}
}

export function positionToSizeRestrictions(positionRestrictions: PositionRestrictions): SizeRestrictions {
	return {
		minWidth: 0,
		minHeight: 0,
		maxWidth:
			positionRestrictions.right !== undefined && positionRestrictions.left !== undefined
				? positionRestrictions.right - positionRestrictions.left
				: Infinity,
		maxHeight:
			positionRestrictions.bottom !== undefined && positionRestrictions.top !== undefined
				? positionRestrictions.bottom - positionRestrictions.top
				: Infinity,
	};
}

export function mergePositionRestrictions(a: PositionRestrictions, b: PositionRestrictions) {
	const limits: Limits = {};
	ALL_DIRECTIONS.forEach((direction) => {
		const firstDirection = a[direction];
		const secondDirection = b[direction];
		if (firstDirection !== undefined && secondDirection !== undefined) {
			if (direction === 'left' || direction === 'top') {
				limits[direction] = Math.max(firstDirection, secondDirection);
			} else {
				limits[direction] = Math.min(firstDirection, secondDirection);
			}
		} else if (secondDirection !== undefined) {
			limits[direction] = secondDirection;
		} else if (firstDirection !== undefined) {
			limits[direction] = firstDirection;
		}
	});
	return limits;
}

export function fitToPositionRestrictions(coordinates: Coordinates, positionRestrictions: PositionRestrictions) {
	const directions = {
		left: 0,
		top: 0,
	};

	const intersection = getIntersections(coordinates, positionRestrictions);

	if (intersection.left && intersection.left > 0) {
		directions.left = intersection.left;
	} else if (intersection.right && intersection.right > 0) {
		directions.left = -intersection.right;
	}
	if (intersection.top && intersection.top > 0) {
		directions.top = intersection.top;
	} else if (intersection.bottom && intersection.bottom > 0) {
		directions.top = -intersection.bottom;
	}

	return directions;
}

export function moveToPositionRestrictions(coordinates: Coordinates, positionRestrictions: PositionRestrictions) {
	return applyMove(coordinates, fitToPositionRestrictions(coordinates, positionRestrictions));
}

export function coordinatesToPositionRestrictions(coordinates: Coordinates) {
	return {
		left: coordinates.left,
		top: coordinates.top,
		right: coordinates.left + coordinates.width,
		bottom: coordinates.top + coordinates.height,
	};
}

export function calculateAspectRatio(
	local: AspectRatio = {},
	global: {
		minAspectRatio?: number;
		maxAspectRatio?: number;
		aspectRatio?: number;
	} = {},
): Required<AspectRatio> {
	const { minAspectRatio, maxAspectRatio, aspectRatio } = global;

	let { minimum, maximum } = local;

	if (isUndefined(minimum)) {
		minimum = !isUndefined(aspectRatio) ? aspectRatio : minAspectRatio;
	}
	if (isUndefined(maximum)) {
		maximum = !isUndefined(aspectRatio) ? aspectRatio : maxAspectRatio;
	}
	return {
		minimum: minimum || 0,
		maximum: maximum || Infinity,
	};
}
