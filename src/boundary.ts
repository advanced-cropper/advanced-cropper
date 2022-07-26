import { Size } from './types';

export interface BoundaryStretchParams {
	boundary: HTMLElement;
	stretcher: HTMLElement;
	size: Size;
}

export function stretchBoundary({ boundary, stretcher, size }: BoundaryStretchParams): void {
	// Reset stretcher
	stretcher.style.width = `0px`;
	stretcher.style.height = `0px`;

	// Try to fit the size by width:
	stretcher.style.width = `${Math.max(boundary.clientWidth, size.width)}px`;

	// After that try to fit the size by height and resulted width:
	const ratio = size.width / size.height;

	stretcher.style.height = `${Math.max(boundary.clientHeight, stretcher.clientWidth / ratio)}px`;
	stretcher.style.width = `${stretcher.clientHeight * ratio}px`;
}

export type BoundaryStretchAlgorithm = typeof stretchBoundary;
