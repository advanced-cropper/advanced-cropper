import { Boundary, Size } from '../types';

export function fitBoundary(boundary: HTMLElement, size: Size): Boundary {
	const areaHeight = boundary.clientHeight;
	const areaWidth = boundary.clientWidth;

	let currentHeight = areaHeight;
	let currentWidth = (size.width * areaHeight) / size.height;

	if (currentWidth > areaWidth) {
		currentWidth = areaWidth;
		currentHeight = (size.height * areaWidth) / size.width;
	}

	return {
		width: currentWidth,
		height: currentHeight,
	};
}

export function fillBoundary(boundary: HTMLElement): Boundary {
	return {
		width: boundary.clientWidth,
		height: boundary.clientHeight,
	};
}
