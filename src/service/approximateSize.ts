// This function returns the approximation size to width / height with respect to
// restrictions and aspect ratio
import { AspectRatio, Size, SizeRestrictions } from '../types';
import { ratio, resizeToSizeRestrictions, sizeDistance } from './utils';
import { isGreater, isLower } from '../utils';

function validateSize(params: {
	size: Size;
	aspectRatio: AspectRatio;
	sizeRestrictions: SizeRestrictions;
	ignoreMinimum?: boolean;
}) {
	const { size, aspectRatio, ignoreMinimum, sizeRestrictions } = params;
	return (
		!isLower(ratio(size), aspectRatio.minimum || 0) &&
		!isGreater(ratio(size), aspectRatio.maximum || Infinity) &&
		!isGreater(size.height, sizeRestrictions.maxHeight) &&
		!isGreater(size.width, sizeRestrictions.maxWidth) &&
		size.width &&
		size.height &&
		(ignoreMinimum || (size.height >= sizeRestrictions.minHeight && size.width >= sizeRestrictions.minWidth))
	);
}

// Limitations:
// 1. Assume that maximum width and height always larger than minimum width and height
// 2. Assume that aspectRatio.minimum < aspectRatio.maximum
// If you break this limitations function could return null!
export function approximateSize(params: {
	width: number;
	height: number;
	sizeRestrictions: SizeRestrictions;
	aspectRatio?: AspectRatio;
}): Size {
	const { width, height, sizeRestrictions } = params;

	const aspectRatio = {
		minimum: (params.aspectRatio && params.aspectRatio.minimum) || 0,
		maximum: (params.aspectRatio && params.aspectRatio.maximum) || Infinity,
	};

	const coordinates = {
		width: Math.max(sizeRestrictions.minWidth, Math.min(sizeRestrictions.maxWidth, width)),
		height: Math.max(sizeRestrictions.minHeight, Math.min(sizeRestrictions.maxHeight, height)),
	};

	function findBestCandidate(candidates: Size[], ignoreMinimum = false): Size | null {
		return candidates.reduce<Size | null>((minimum: Size | null, size: Size) => {
			if (validateSize({ size, aspectRatio, sizeRestrictions, ignoreMinimum })) {
				return !minimum || sizeDistance(size, { width, height }) < sizeDistance(minimum, { width, height })
					? size
					: minimum;
			} else {
				return minimum;
			}
		}, null);
	}

	let candidates: Size[] = [];

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

	if (validateSize({ size: coordinates, aspectRatio, sizeRestrictions })) {
		candidates.push(coordinates);
	}

	// Resize the candidates as much as possible to prevent breaking minimum size
	candidates = candidates.map((candidate) => resizeToSizeRestrictions(candidate, sizeRestrictions));

	const candidate = findBestCandidate(candidates) || findBestCandidate(candidates, true);

	// TODO: fix the type of return value
	return (candidate && {
		width: candidate.width,
		height: candidate.height,
	}) as Size;
}
