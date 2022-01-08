import { Boundary, Size } from '../types';

export interface DefaultBoundaryParams {
	boundary: HTMLElement;
	size: Size;
}

export function fitBoundary({ boundary, size }: DefaultBoundaryParams): Boundary {
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

export function fillBoundary({ boundary }: DefaultBoundaryParams): Boundary {
	return {
		width: boundary.clientWidth,
		height: boundary.clientHeight,
	};
}
