import { Size } from '../types';

export interface StretchParams {
	boundary: HTMLElement;
	stretcher: HTMLElement;
	size: Size;
}

export function updateStretcher({ boundary, stretcher, size }: StretchParams): void {
	const height = boundary.clientWidth * (size.height / size.width);

	stretcher.style.height = `${height}px`;

	if (boundary) {
		stretcher.style.height = `${Math.max(height, boundary.clientHeight)}px`;
		stretcher.style.width = `${Math.max(
			boundary.clientWidth,
			stretcher.clientHeight * (size.height / size.width),
		)}px`;
	}

	// Prevent stretching in future until stretcher will be reinitialized
	stretcher.style.width = `${boundary.clientWidth}px`;
}

export type StretchAlgorithm = typeof updateStretcher;
