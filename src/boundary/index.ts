import { Size } from '../types';
import { ratio } from '../service';

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

	// Try to fit the size by width:
	stretcher.style.width = `${Math.max(boundary.getBoundingClientRect().width, size.width)}px`;

	// After that try to fit the size by height and resulted width:
	const ratio = size.width / size.height;

	stretcher.style.height = `${Math.max(
		boundary.getBoundingClientRect().height,
		stretcher.getBoundingClientRect().width / ratio,
	)}px`;
	stretcher.style.width = `${stretcher.getBoundingClientRect().height * ratio}px`;

	if (stretcher.clientWidth / stretcher.clientHeight > boundary.clientWidth / boundary.clientHeight) {
		if (stretcher.clientWidth > boundary.clientWidth) {
			stretcher.style.width = `${boundary.clientWidth}px`;
			stretcher.style.height = `${boundary.clientWidth / ratio}px`;
		}
	} else {
		if (stretcher.clientHeight > boundary.clientHeight) {
			stretcher.style.height = `${boundary.clientHeight}px`;
			stretcher.style.width = `${boundary.clientHeight * ratio}px`;
		}
	}
}

export type BoundaryStretchAlgorithm = (boundary: HTMLElement, stretcher: HTMLElement, size: Size) => void;
