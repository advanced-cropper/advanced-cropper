import {
	AspectRatio,
	Coordinates,
	MoveDirections,
	PositionRestrictions,
	ResizeDirections,
	SizeRestrictions,
	ResizeAnchor,
} from '../types';
import { ALL_DIRECTIONS, HORIZONTAL_DIRECTIONS, VERTICAL_DIRECTIONS } from '../constants';
import {
	applyDirections,
	applyMove,
	diff,
	getBrokenRatio,
	getIntersections,
	getOppositeSide,
	moveToPositionRestrictions,
	ratio,
} from '../service';
import { moveCoordinatesAlgorithm } from './moveCoordinatesAlgorithm';
import { ResizeOptions } from '../state';
import { isGreater, isRoughlyEqual } from '../utils';

interface FitDirectionsParams {
	directions: ResizeDirections;
	coordinates: Coordinates;
	positionRestrictions: PositionRestrictions;
	sizeRestrictions: SizeRestrictions;
	allowedDirections: {
		left?: boolean;
		right?: boolean;
		top?: boolean;
		bottom?: boolean;
	};
	preserveRatio?: boolean;
	compensate?: boolean;
}

export function fitDirections({
	coordinates,
	directions,
	positionRestrictions,
	sizeRestrictions,
	preserveRatio,
	allowedDirections,
	compensate = true,
}: FitDirectionsParams): ResizeDirections {
	const fittedDirections = { ...directions };

	let currentWidth = applyDirections(coordinates, fittedDirections).width;
	let currentHeight = applyDirections(coordinates, fittedDirections).height;

	// Prevent strange resizes when the width or height of stencil becomes smaller than 0
	if (currentWidth < 0) {
		if (fittedDirections.left < 0 && fittedDirections.right < 0) {
			fittedDirections.left =
				-(coordinates.width - sizeRestrictions.minWidth) / (fittedDirections.left / fittedDirections.right);
			fittedDirections.right =
				-(coordinates.width - sizeRestrictions.minWidth) / (fittedDirections.right / fittedDirections.left);
		} else if (fittedDirections.left < 0) {
			fittedDirections.left = -(coordinates.width - sizeRestrictions.minWidth);
		} else if (fittedDirections.right < 0) {
			fittedDirections.right = -(coordinates.width - sizeRestrictions.minWidth);
		}
	}
	if (currentHeight < 0) {
		if (fittedDirections.top < 0 && fittedDirections.bottom < 0) {
			fittedDirections.top =
				-(coordinates.height - sizeRestrictions.minHeight) / (fittedDirections.top / fittedDirections.bottom);
			fittedDirections.bottom =
				-(coordinates.height - sizeRestrictions.minHeight) / (fittedDirections.bottom / fittedDirections.top);
		} else if (fittedDirections.top < 0) {
			fittedDirections.top = -(coordinates.height - sizeRestrictions.minHeight);
		} else if (fittedDirections.bottom < 0) {
			fittedDirections.bottom = -(coordinates.height - sizeRestrictions.minHeight);
		}
	}

	// Prevent breaking limits
	let breaks = getIntersections(applyDirections(coordinates, fittedDirections), positionRestrictions);

	const canBeCompensated = ALL_DIRECTIONS.every((direction) => {
		return !isGreater(breaks[getOppositeSide(direction)], 0) || allowedDirections[direction];
	});

	if (compensate && canBeCompensated) {
		if (breaks.left && breaks.left > 0 && breaks.right === 0) {
			fittedDirections.right += breaks.left;
			fittedDirections.left -= breaks.left;
		} else if (breaks.right && breaks.right > 0 && breaks.left === 0) {
			fittedDirections.left += breaks.right;
			fittedDirections.right -= breaks.right;
		}

		if (breaks.top && breaks.top > 0 && breaks.bottom === 0) {
			fittedDirections.bottom += breaks.top;
			fittedDirections.top -= breaks.top;
		} else if (breaks.bottom && breaks.bottom > 0 && breaks.top === 0) {
			fittedDirections.top += breaks.bottom;
			fittedDirections.bottom -= breaks.bottom;
		}

		breaks = getIntersections(applyDirections(coordinates, fittedDirections), positionRestrictions);
	}

	const maxResize = {
		width: Infinity,
		height: Infinity,
		left: Infinity,
		right: Infinity,
		top: Infinity,
		bottom: Infinity,
	};

	ALL_DIRECTIONS.forEach((direction) => {
		const intersection = breaks[direction];
		if (intersection && fittedDirections[direction]) {
			maxResize[direction] = Math.max(0, 1 - intersection / fittedDirections[direction]);
		}
	});

	if (preserveRatio) {
		const multiplier = Math.min(...ALL_DIRECTIONS.map((direction) => maxResize[direction]));
		if (multiplier !== Infinity) {
			ALL_DIRECTIONS.forEach((direction) => {
				fittedDirections[direction] *= multiplier;
			});
		}
	} else {
		ALL_DIRECTIONS.forEach((direction) => {
			if (maxResize[direction] !== Infinity) {
				fittedDirections[direction] *= maxResize[direction];
			}
		});
	}

	currentWidth = applyDirections(coordinates, fittedDirections).width;
	currentHeight = applyDirections(coordinates, fittedDirections).height;

	if (fittedDirections.right + fittedDirections.left) {
		if (currentWidth > sizeRestrictions.maxWidth) {
			maxResize.width =
				(sizeRestrictions.maxWidth - coordinates.width) / (fittedDirections.right + fittedDirections.left);
		} else if (currentWidth < sizeRestrictions.minWidth) {
			maxResize.width =
				(sizeRestrictions.minWidth - coordinates.width) / (fittedDirections.right + fittedDirections.left);
		}
	}

	if (fittedDirections.bottom + fittedDirections.top) {
		if (currentHeight > sizeRestrictions.maxHeight) {
			maxResize.height =
				(sizeRestrictions.maxHeight - coordinates.height) / (fittedDirections.bottom + fittedDirections.top);
		} else if (currentHeight < sizeRestrictions.minHeight) {
			maxResize.height =
				(sizeRestrictions.minHeight - coordinates.height) / (fittedDirections.bottom + fittedDirections.top);
		}
	}

	if (preserveRatio) {
		const multiplier = Math.min(maxResize.width, maxResize.height);
		if (multiplier !== Infinity) {
			ALL_DIRECTIONS.forEach((direction) => {
				fittedDirections[direction] *= multiplier;
			});
		}
	} else {
		if (maxResize.width !== Infinity) {
			HORIZONTAL_DIRECTIONS.forEach((direction) => {
				fittedDirections[direction] *= maxResize.width;
			});
		}
		if (maxResize.height !== Infinity) {
			VERTICAL_DIRECTIONS.forEach((direction) => {
				fittedDirections[direction] *= maxResize.height;
			});
		}
	}

	return fittedDirections;
}

export interface ResizeLimitations {
	aspectRatio: AspectRatio;
	sizeRestrictions: SizeRestrictions;
	positionRestrictions: PositionRestrictions;
}

function distributeOverlap(overlap: number, first: number, second: number) {
	if (isRoughlyEqual(first + second, 0)) {
		return overlap / 2;
	} else if (isRoughlyEqual(first, 0)) {
		return 0;
	} else if (isRoughlyEqual(second, 0)) {
		return overlap;
	} else {
		return overlap * Math.abs(first / (first + second));
	}
}

export function resizeCoordinatesAlgorithm(
	coordinates: Coordinates,
	directions: ResizeDirections,
	options: {
		compensate?: boolean;
		preserveAspectRatio?: boolean;
		allowedDirections?: {
			left?: boolean;
			right?: boolean;
			top?: boolean;
			bottom?: boolean;
		};
		respectDirection?: 'width' | 'height';
	},
	limitations: ResizeLimitations,
): Coordinates {
	const { aspectRatio, positionRestrictions, sizeRestrictions } = limitations;

	const actualCoordinates = {
		...coordinates,
	};
	directions = {
		...directions,
	};

	const allowedDirections = options.allowedDirections || {
		left: true,
		right: true,
		bottom: true,
		top: true,
	};

	// It's possible that coordinates can be smaller than minimum width or minimum height. In this case
	// corresponding resize should be blocked
	if (coordinates.width < sizeRestrictions.minWidth) {
		directions.left = 0;
		directions.right = 0;
	}
	if (coordinates.height < sizeRestrictions.minHeight) {
		directions.top = 0;
		directions.bottom = 0;
	}

	ALL_DIRECTIONS.forEach((direction) => {
		if (!allowedDirections[direction]) {
			directions[direction] = 0;
		}
	});

	// 1. First step: determine the safe and desired area
	directions = fitDirections({
		coordinates: actualCoordinates,
		directions,
		sizeRestrictions,
		positionRestrictions,
		allowedDirections,
	});

	// 2. Second step: fix desired box to correspondent to aspect ratio
	let currentWidth = applyDirections(actualCoordinates, directions).width;
	let currentHeight = applyDirections(actualCoordinates, directions).height;

	// Checks ratio:
	let ratioBroken = options.preserveAspectRatio
		? ratio(actualCoordinates)
		: getBrokenRatio(currentWidth / currentHeight, aspectRatio);

	if (ratioBroken) {
		let { respectDirection } = options;
		if (respectDirection !== 'width' && respectDirection !== 'height') {
			if (actualCoordinates.width >= actualCoordinates.height || ratioBroken === 1) {
				respectDirection = 'width';
			} else {
				respectDirection = 'height';
			}
		}
		if (respectDirection === 'width') {
			const overlapHeight = currentWidth / ratioBroken - actualCoordinates.height;
			if (allowedDirections.top && allowedDirections.bottom) {
				const { top, bottom } = directions;
				directions.bottom = distributeOverlap(overlapHeight, bottom, top);
				directions.top = distributeOverlap(overlapHeight, top, bottom);
			} else if (allowedDirections.bottom) {
				directions.bottom = overlapHeight;
			} else if (allowedDirections.top) {
				directions.top = overlapHeight;
			} else if (allowedDirections.right) {
				directions.right = 0;
			} else if (allowedDirections.left) {
				directions.left = 0;
			}
		} else if (respectDirection === 'height') {
			const overlapWidth = actualCoordinates.width - currentHeight * ratioBroken;
			if (allowedDirections.left && allowedDirections.right) {
				const { left, right } = directions;
				directions.left = -distributeOverlap(overlapWidth, left, right);
				directions.right = -distributeOverlap(overlapWidth, right, left);
			} else if (allowedDirections.left) {
				directions.left = -overlapWidth;
			} else if (allowedDirections.right) {
				directions.right = -overlapWidth;
			} else if (allowedDirections.top) {
				directions.top = 0;
			} else if (allowedDirections.bottom) {
				directions.bottom = 0;
			}
		}
		// 3. Third step: check if desired box with correct aspect ratios break some limits and fit to this conditions
		directions = fitDirections({
			directions,
			coordinates: actualCoordinates,
			sizeRestrictions: sizeRestrictions,
			positionRestrictions,
			preserveRatio: true,
			compensate: options.compensate,
			allowedDirections,
		});
	}

	// 4. Check if ratio broken (temporary):
	currentWidth = applyDirections(actualCoordinates, directions).width;
	currentHeight = applyDirections(actualCoordinates, directions).height;
	ratioBroken = options.preserveAspectRatio
		? ratio(actualCoordinates)
		: getBrokenRatio(currentWidth / currentHeight, aspectRatio);
	if (ratioBroken && isGreater(Math.abs(ratioBroken - currentWidth / currentHeight), 0)) {
		ALL_DIRECTIONS.forEach((direction) => {
			directions[direction] = 0;
		});
	}

	return moveCoordinatesAlgorithm(
		{
			width: coordinates.width + directions.right + directions.left,
			height: coordinates.height + directions.top + directions.bottom,
			left: coordinates.left,
			top: coordinates.top,
		},
		{
			left: -directions.left,
			top: -directions.top,
		},
		positionRestrictions,
	);
}

function anchorToMassPoint(coordinates: Coordinates, anchor: ResizeAnchor) {
	const plainAnchor = anchor.toLowerCase();
	return {
		left:
			coordinates.left +
			coordinates.width * (plainAnchor.indexOf('west') !== -1 ? 1 : plainAnchor.indexOf('east') !== -1 ? 0 : 0.5),
		top:
			coordinates.top +
			coordinates.height *
				(plainAnchor.indexOf('north') !== -1 ? 1 : plainAnchor.indexOf('south') !== -1 ? 0 : 0.5),
	};
}

export function anchorToAllowedDirections(anchor: ResizeAnchor) {
	const plainAnchor = anchor.toLowerCase();
	return {
		left: plainAnchor.indexOf('east') === -1,
		top: plainAnchor.indexOf('south') === -1,
		right: plainAnchor.indexOf('west') === -1,
		bottom: plainAnchor.indexOf('north') === -1,
	};
}
export function anchorMoveToResizeDirections(anchor: ResizeAnchor, directions: MoveDirections) {
	const plainAnchor = anchor.toLowerCase();

	const normalizedDirections = {
		left: plainAnchor.indexOf('west') === -1 ? directions.left : -directions.left,
		top: 0 && plainAnchor.indexOf('north') === -1 ? directions.top : -directions.top,
		right: directions.left,
		bottom: directions.top,
	};

	if (['north', 'south', 'center'].every((el) => plainAnchor.indexOf(el) === -1)) {
		normalizedDirections.top = 0;
		normalizedDirections.bottom = 0;
	}

	if (['west', 'east', 'center'].every((el) => plainAnchor.indexOf(el) === -1)) {
		normalizedDirections.left = 0;
		normalizedDirections.right = 0;
	}

	const allowedDirections = anchorToAllowedDirections(anchor);
	ALL_DIRECTIONS.forEach((direction) => {
		if (!allowedDirections[direction]) {
			normalizedDirections[direction] = 0;
		}
	});

	return normalizedDirections;
}

export function anchoredResizeCoordinatesAlgorithm(
	coordinates: Coordinates,
	anchor: ResizeAnchor,
	directions: MoveDirections,
	options: ResizeOptions,
	limitations: ResizeLimitations,
): Coordinates {
	const { reference } = options;

	const resizeDirections = anchorMoveToResizeDirections(anchor, directions);
	const allowedDirections = anchorToAllowedDirections(anchor);

	let result = resizeCoordinatesAlgorithm(
		coordinates,
		resizeDirections,
		{
			...options,
			allowedDirections,
		},
		limitations,
	);
	if (reference) {
		// Move the result to anchor
		result = applyMove(result, diff(anchorToMassPoint(reference, anchor), anchorToMassPoint(result, anchor)));
	}

	return moveToPositionRestrictions(result, limitations.positionRestrictions);
}
