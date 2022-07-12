import { Size } from '../../types';
import { rotateSize } from '../../service';
import { BoundingBox, BoundingBoxType } from './types';

export function circleBoundingBox(size: Size, angle: number): Size {
	return size;
}

export function rectangleBoundingBox(size: Size, angle: number): Size {
	return rotateSize(size, angle);
}

export function getBoundingBox(size: Size, angle: number, algorithm?: BoundingBox) {
	if (algorithm === BoundingBoxType.Circle) {
		return circleBoundingBox(size, angle);
	} else {
		return rectangleBoundingBox(size, angle);
	}
}
