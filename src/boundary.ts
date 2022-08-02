import { Size } from './types';
import { ratio } from './service';

export function stretchCropperBoundary(boundary: HTMLElement, stretcher: HTMLElement, size: Size): void {
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

export function stretchPreviewBoundary(boundary: HTMLElement, stretcher: HTMLElement, size: Size): void {
	// Reset stretcher
	stretcher.style.width = `0px`;
	stretcher.style.height = `0px`;

	// Stretch the boundary with respect to its width
	const width = Math.max(boundary.clientWidth, size.width);
	stretcher.style.width = `${width}px`;
	stretcher.style.height = `${width / ratio(size)}px`;

	// If the height of boundary larger than current stretcher height
	// stretch the boundary with respect to its height
	if (stretcher.clientHeight < boundary.clientHeight) {
		stretcher.style.height = `${boundary.clientHeight}px`;
		stretcher.style.width = `${stretcher.clientHeight * ratio(size)}px`;
	}
}

export type BoundaryStretchAlgorithm = (boundary: HTMLElement, stretcher: HTMLElement, size: Size) => void;
