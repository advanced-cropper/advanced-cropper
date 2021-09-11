import { CropperState } from '../types';
import { isRoughlyEqual } from '../utils';

function isEqualStateFields(a: null | any, b: null | any) {
	if (a === null && b === null) {
		return true;
	} else if (a === null || b === null) {
		return false;
	} else {
		const aKeys = Object.keys(a);
		const bKeys = Object.keys(b);
		return (
			aKeys.length === bKeys.length && aKeys.every((key) => a[key] === b[key] || isRoughlyEqual(a[key], b[key]))
		);
	}
}

export function isEqualStates(a: CropperState | null, b: CropperState | null): boolean {
	if (a === null && b === null) {
		return true;
	} else if (a === null || b === null) {
		return false;
	} else {
		return (
			isEqualStateFields(a.coordinates, b.coordinates) &&
			isEqualStateFields(a.boundary, b.boundary) &&
			isEqualStateFields(a.imageSize, b.imageSize) &&
			isEqualStateFields(a.visibleArea, b.visibleArea) &&
			a.transforms.rotate === b.transforms.rotate &&
			a.transforms.flip.horizontal === b.transforms.flip.horizontal &&
			a.transforms.flip.vertical === b.transforms.flip.vertical
		);
	}
}
