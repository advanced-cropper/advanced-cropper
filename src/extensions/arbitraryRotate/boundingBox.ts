import { Size } from '../../types';
import { rotateSize } from '../../service';
import { isFunction } from '../../utils';

export enum BoundingBoxTypes {
	Circle = 'circle',
	Rectangle = 'rectangle',
}

export type BoundingBoxFunction = (size: Size, angle: number) => Size;

export type BoundingBox = BoundingBoxTypes | BoundingBoxFunction;

export function circleBoundingBox(size: Size, angle: number): Size {
	return size;
}

export function rectangleBoundingBox(size: Size, angle: number): Size {
	return rotateSize(size, angle);
}

export function getBoundingBox(size: Size, angle: number, algorithm?: BoundingBox) {
	if (isFunction(algorithm)) {
		return algorithm(size, angle);
	} else if (algorithm === BoundingBoxTypes.Circle) {
		return circleBoundingBox(size, angle);
	} else {
		return rectangleBoundingBox(size, angle);
	}
}
