// This function returns the approximation size to width / height with respect to
// restrictions and aspect ratio
import { RawAspectRatio, Size, SizeRestrictions } from '../types';
import { createAspectRatio, getCloserSize, resizeToSizeRestrictions } from './utils';

// Limitations:
// 1. Assume that maximum width and height always larger than minimum width and height
// 2. Assume that aspectRatio.minimum < aspectRatio.maximum
// If you break this limitations function could return null!
export function approximateSize(params: {
	width: number;
	height: number;
	sizeRestrictions?: SizeRestrictions;
	aspectRatio?: RawAspectRatio;
}): Size {
	const { width, height } = params;

	const sizeRestrictions = params.sizeRestrictions || {
		minWidth: 0,
		minHeight: 0,
		maxWidth: Infinity,
		maxHeight: Infinity,
	};

	const aspectRatio = createAspectRatio(params.aspectRatio);

	const coordinates = {
		width: Math.max(sizeRestrictions.minWidth, Math.min(sizeRestrictions.maxWidth, width)),
		height: Math.max(sizeRestrictions.minHeight, Math.min(sizeRestrictions.maxHeight, height)),
	};

	let candidates: Size[] = [coordinates];

	if (aspectRatio) {
		[aspectRatio.minimum, aspectRatio.maximum].forEach((ratio) => {
			if (ratio) {
				candidates.push(
					{ width: coordinates.width, height: coordinates.width / ratio },
					{ width: coordinates.height * ratio, height: coordinates.height },
				);
			}
		});
	}

	// Resize the candidates as much as possible to prevent breaking minimum size
	candidates = candidates.map((candidate) => resizeToSizeRestrictions(candidate, sizeRestrictions));

	// TODO: fix the type of return value
	return getCloserSize(candidates, { width, height }, sizeRestrictions, aspectRatio) as Size;
}
