import { ALL_DIRECTIONS, MAIN_DIRECTIONS } from './constants';
import { ManipulateImageEvent, MoveEvent, ResizeEvent } from './events';
import {
	Coordinates,
	Point,
	Size,
	Limits,
	SizeRestrictions,
	AspectRatio,
	PositionRestrictions,
	VisibleArea,
	AreaRestrictions,
	Boundaries,
	ImageRestriction,
} from './typings';

import {
	applyDirections,
	applyMove,
	applyScale,
	fitConditions,
	getBrokenRatio,
	getCenter,
	getIntersections,
	fit,
	ratio,
	diff,
	fitSize,
	inverseMove,
	isEqual,
	maxScale,
	toLimits,
} from './service';

interface MoveParams {
	event: MoveEvent;
	coordinates: Coordinates;
	positionRestrictions: PositionRestrictions;
}

export function move(params: MoveParams): Coordinates {
	const { event, coordinates, positionRestrictions = {} } = params;
	const movedCoordinates = applyMove(coordinates, event.directions);

	return applyMove(movedCoordinates, fit(movedCoordinates, positionRestrictions));
}

export interface ResizeParams {
	event: ResizeEvent;
	coordinates: Coordinates;
	aspectRatio: AspectRatio;
	sizeRestrictions: SizeRestrictions;
	positionRestrictions: PositionRestrictions;
}

export function resize(params: ResizeParams): Coordinates {
	const { event, coordinates, aspectRatio, positionRestrictions, sizeRestrictions } = params;
	const actualCoordinates = {
		...coordinates,
		right: coordinates.left + coordinates.width,
		bottom: coordinates.top + coordinates.height,
	};

	const eventParams = event.params || {};

	let directions = {
		...event.directions,
	};

	const allowedDirections = eventParams.allowedDirections || {
		left: true,
		right: true,
		bottom: true,
		top: true,
	};

	if (sizeRestrictions.widthFrozen) {
		directions.left = 0;
		directions.right = 0;
	}

	if (sizeRestrictions.heightFrozen) {
		directions.top = 0;
		directions.bottom = 0;
	}

	ALL_DIRECTIONS.forEach((direction) => {
		if (!allowedDirections[direction]) {
			directions[direction] = 0;
		}
	});

	// 1. First step: determine the safe and desired area
	directions = fitConditions({
		coordinates: actualCoordinates,
		directions,
		sizeRestrictions: sizeRestrictions,
		positionRestrictions,
	});

	// 2. Second step: fix desired box to correspondent to aspect ratio
	let currentWidth = applyDirections(actualCoordinates, directions).width;
	let currentHeight = applyDirections(actualCoordinates, directions).height;

	// Checks ratio:
	let ratioBroken = eventParams.preserveRatio
		? ratio(actualCoordinates)
		: getBrokenRatio(currentWidth / currentHeight, aspectRatio);

	if (ratioBroken) {
		let { respectDirection } = eventParams;
		if (!respectDirection) {
			if (actualCoordinates.width >= actualCoordinates.height || ratioBroken === 1) {
				respectDirection = 'width';
			} else {
				respectDirection = 'height';
			}
		}
		if (respectDirection === 'width') {
			const overlapHeight = currentWidth / ratioBroken - actualCoordinates.height;
			if (allowedDirections.top && allowedDirections.bottom) {
				directions.bottom = overlapHeight / 2;
				directions.top = overlapHeight / 2;
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
				directions.left = -overlapWidth / 2;
				directions.right = -overlapWidth / 2;
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
		directions = fitConditions({
			directions,
			coordinates: actualCoordinates,
			sizeRestrictions: sizeRestrictions,
			positionRestrictions,
			preserveRatio: true,
			compensate: eventParams.compensate,
		});
	}

	// 4. Check if ratio broken (temporary):
	currentWidth = applyDirections(actualCoordinates, directions).width;
	currentHeight = applyDirections(actualCoordinates, directions).height;
	ratioBroken = eventParams.preserveRatio
		? ratio(actualCoordinates)
		: getBrokenRatio(currentWidth / currentHeight, aspectRatio);
	if (ratioBroken && Math.abs(ratioBroken - currentWidth / currentHeight) > 1e-3) {
		if (process.env.NODE_ENV !== 'production') {
			console.error(
				`Something went wrong and ratio was broken: ${currentWidth / currentHeight} instead of ${ratioBroken}`,
			);
		}
		ALL_DIRECTIONS.forEach((direction) => {
			if (!allowedDirections[direction]) {
				directions[direction] = 0;
			}
		});
	}

	return move({
		event: new MoveEvent({
			left: -directions.left,
			top: -directions.top,
		}),
		coordinates: {
			width: coordinates.width + directions.right + directions.left,
			height: coordinates.height + directions.top + directions.bottom,
			left: coordinates.left,
			top: coordinates.top,
		},
		positionRestrictions,
	});
}

// The main point of this feature is calculating the needed position of stencil and parameters of world transforms
// Real coordinates don't changes here
interface AutoZoomParams {
	coordinates: Coordinates;
	visibleArea: VisibleArea;
	areaRestrictions: AreaRestrictions;
}
interface AutoZoomResult {
	visibleArea: VisibleArea;
}
export function autoZoom(params: AutoZoomParams): AutoZoomResult {
	const { coordinates: originalCoordinates, visibleArea: originalVisibleArea, areaRestrictions } = params;

	let visibleArea = { ...originalVisibleArea };
	const coordinates = { ...originalCoordinates };

	const widthIntersections = Math.max(0, coordinates.width - visibleArea.width);
	const heightIntersections = Math.max(0, coordinates.height - visibleArea.height);

	if (widthIntersections > heightIntersections) {
		visibleArea = applyScale(
			visibleArea,
			Math.min(coordinates.width / visibleArea.width, maxScale(visibleArea, areaRestrictions)),
		);
	} else if (heightIntersections > widthIntersections) {
		visibleArea = applyScale(
			visibleArea,
			Math.min(coordinates.height / visibleArea.height, maxScale(visibleArea, areaRestrictions)),
		);
	}

	visibleArea = applyMove(visibleArea, inverseMove(fit(coordinates, toLimits(visibleArea))));

	visibleArea = applyMove(visibleArea, fit(visibleArea, areaRestrictions));

	return {
		visibleArea,
	};
}

interface ManipulateImageParams {
	event: ManipulateImageEvent;
	coordinates: Coordinates;
	visibleArea: VisibleArea;
	sizeRestrictions: SizeRestrictions;
	positionRestrictions: PositionRestrictions;
	areaRestrictions: AreaRestrictions;
	settings: {
		stencil?: boolean;
	};
}
interface ManipulateImageResult {
	visibleArea: VisibleArea;
	coordinates: Coordinates;
}
export function manipulateImage(params: ManipulateImageParams): ManipulateImageResult {
	const {
		event,
		coordinates: originalCoordinates,
		visibleArea: originalVisibleArea,
		sizeRestrictions,
		areaRestrictions,
		positionRestrictions,
		settings = {},
	} = params;

	const { scale, move } = event;

	let visibleArea = { ...originalVisibleArea };
	const coordinates = { ...originalCoordinates };

	let areaScale = 1;
	let stencilScale = 1;
	const allowedScale =
		scale.factor &&
		Math.abs(scale.factor - 1) > 1e-3 &&
		!sizeRestrictions.widthFrozen &&
		!sizeRestrictions.heightFrozen;

	visibleArea = applyMove(visibleArea, {
		left: move.left || 0,
		top: move.top || 0,
	});

	const scaleRestrictions = {
		stencil: {
			minimum: Math.max(
				sizeRestrictions.minWidth ? sizeRestrictions.minWidth / coordinates.width : 0,
				sizeRestrictions.minHeight ? sizeRestrictions.minHeight / coordinates.height : 0,
			),
			maximum: Math.min(
				sizeRestrictions.maxWidth ? sizeRestrictions.maxWidth / coordinates.width : Infinity,
				sizeRestrictions.maxHeight ? sizeRestrictions.maxHeight / coordinates.height : Infinity,
				maxScale(coordinates, positionRestrictions),
			),
		},
		area: {
			maximum: maxScale(visibleArea, areaRestrictions),
		},
	};

	// If there is scaling then begin scale
	if (scale.factor && allowedScale) {
		// Determine scale factor
		if (scale.factor < 1) {
			stencilScale = Math.max(scale.factor, scaleRestrictions.stencil.minimum);
		} else if (scale.factor > 1) {
			stencilScale = Math.min(
				scale.factor,
				Math.min(scaleRestrictions.area.maximum, scaleRestrictions.stencil.maximum),
			);
		}
	}

	if (stencilScale) {
		// Resize stencil with area as much is possible
		visibleArea = applyScale(visibleArea, stencilScale, scale.center);
	}

	const relativeCoordinates = {
		left: originalCoordinates.left - originalVisibleArea.left,
		right:
			originalVisibleArea.width +
			originalVisibleArea.left -
			(originalCoordinates.width + originalCoordinates.left),
		top: originalCoordinates.top - originalVisibleArea.top,
		bottom:
			originalVisibleArea.height +
			originalVisibleArea.top -
			(originalCoordinates.height + originalCoordinates.top),
	};

	// Move the area to fit to area limits:
	visibleArea = applyMove(visibleArea, fit(visibleArea, areaRestrictions));

	// Move the area to fit to coordinates limits:
	visibleArea = applyMove(
		visibleArea,
		fit(visibleArea, {
			left:
				positionRestrictions.left !== undefined
					? positionRestrictions.left - relativeCoordinates.left * stencilScale
					: undefined,
			top:
				positionRestrictions.top !== undefined
					? positionRestrictions.top - relativeCoordinates.top * stencilScale
					: undefined,
			bottom:
				positionRestrictions.bottom !== undefined
					? positionRestrictions.bottom + relativeCoordinates.bottom * stencilScale
					: undefined,
			right:
				positionRestrictions.right !== undefined
					? positionRestrictions.right + relativeCoordinates.right * stencilScale
					: undefined,
		}),
	);

	// Set the same coordinates of stencil inside visible area
	coordinates.width = coordinates.width * stencilScale;
	coordinates.height = coordinates.height * stencilScale;
	coordinates.left = visibleArea.left + relativeCoordinates.left * stencilScale;
	coordinates.top = visibleArea.top + relativeCoordinates.top * stencilScale;

	// Resize only area if stencil can't be resized and stencil resize is disabled
	if (scale.factor && allowedScale && settings.stencil) {
		if (scale.factor > 1) {
			areaScale = Math.min(scaleRestrictions.area.maximum, scale.factor) / stencilScale;
		} else if (scale.factor < 1) {
			areaScale = Math.max(coordinates.height / visibleArea.height, scale.factor) / stencilScale;
		}
		visibleArea = applyScale(
			visibleArea,
			areaScale,
			getCenter(coordinates),
			Math.pow(scale.factor > 1 ? scaleRestrictions.area.maximum : coordinates.height / visibleArea.height, 2),
		);
		visibleArea = applyMove(visibleArea, fit(visibleArea, areaRestrictions));
	}

	return {
		coordinates,
		visibleArea,
	};
}

// This function returns the approximation size to width / height with respect to
// restrictions and aspect ratio
interface ApproximateSizeParams {
	width: number;
	height: number;
	aspectRatio: AspectRatio;
	sizeRestrictions: SizeRestrictions;
}
export function approximateSize(params: ApproximateSizeParams): Size {
	const { width, height, aspectRatio, sizeRestrictions } = params;
	const ratio = {
		minimum: aspectRatio.minimum || 0,
		maximum: aspectRatio.maximum || Infinity,
	};

	const coordinates = {
		width: Math.max(sizeRestrictions.minWidth, Math.min(sizeRestrictions.maxWidth, width)),
		height: Math.max(sizeRestrictions.minHeight, Math.min(sizeRestrictions.maxHeight, height)),
	};

	function distance(a: Size, b: Size): number {
		return Math.pow(a.width - b.width, 2) + Math.pow(a.height - b.height, 2);
	}

	function isValid(candidate: Size, ignoreMinimum = false): boolean {
		return Boolean(
			candidate.width >= candidate.height * ratio.minimum &&
				candidate.width <= candidate.height * ratio.maximum &&
				candidate.height <= sizeRestrictions.maxHeight &&
				candidate.width <= sizeRestrictions.maxWidth &&
				candidate.width &&
				candidate.height &&
				(ignoreMinimum ||
					(candidate.height >= sizeRestrictions.minHeight && candidate.width >= sizeRestrictions.minWidth)),
		);
	}

	function findBestCandidate(candidates: Size[], ignoreMinimum = false): Size | null {
		return candidates.reduce<Size | null>((minimum: Size | null, candidate: Size) => {
			if (isValid(candidate, ignoreMinimum)) {
				return !minimum || distance(candidate, { width, height }) < distance(minimum, { width, height })
					? candidate
					: minimum;
			} else {
				return minimum;
			}
		}, null);
	}

	const candidates = [];

	[aspectRatio.minimum, aspectRatio.maximum].forEach((ratio) => {
		if (ratio) {
			candidates.push(
				{ width: coordinates.width, height: coordinates.width / ratio },
				{ width: coordinates.height * ratio, height: coordinates.height },
			);
		}
	});

	if (isValid(coordinates)) {
		candidates.push(coordinates);
	}

	const bestCandidate = findBestCandidate(candidates);

	if (bestCandidate) {
		return bestCandidate;
	} else {
		// If there are no candidates that preserves all limitations, choice the best candidate
		// that breaks minimum height or width limitations
		return findBestCandidate(candidates, true) as Size;
	}
}

// This function updates visible area with respect to current transformations and fits
// coordinates to the new visible area
interface UpdateVisibleAreaParams {
	current: VisibleArea;
	previous: VisibleArea;
	areaRestrictions: AreaRestrictions;
	coordinates: Coordinates;
}
export function updateVisibleArea(params: UpdateVisibleAreaParams): VisibleArea {
	const { current, previous, areaRestrictions, coordinates } = params;
	let visibleArea = { ...current };

	if (previous && previous.width && previous.height && !isEqual(current, previous)) {
		// Adapt scale transformations
		if (previous.width > coordinates.width) {
			visibleArea = applyScale(
				visibleArea,
				Math.min(previous.height / visibleArea.height, maxScale(visibleArea, areaRestrictions)),
			);
		} else {
			visibleArea = applyScale(
				visibleArea,
				Math.min(previous.width / visibleArea.width, maxScale(visibleArea, areaRestrictions)),
			);
		}

		// Adapt move transformations
		visibleArea = applyMove(visibleArea, diff(getCenter(previous), getCenter(visibleArea)));

		// Prevent the breaking of limits
		visibleArea = applyMove(visibleArea, fit(visibleArea, areaRestrictions));

		const intersections = getIntersections(coordinates, toLimits(visibleArea));

		if (intersections.left + intersections.right + intersections.top + intersections.bottom) {
			if (intersections.left + intersections.right > intersections.top + intersections.bottom) {
				visibleArea = applyScale(
					visibleArea,
					Math.min(
						(visibleArea.width + intersections.left + intersections.right) / visibleArea.width,
						maxScale(visibleArea, areaRestrictions),
					),
				);
			} else {
				visibleArea = applyScale(
					visibleArea,
					Math.min(
						(visibleArea.width + intersections.top + intersections.bottom) / visibleArea.height,
						maxScale(visibleArea, areaRestrictions),
					),
				);
			}
		}
	}

	return visibleArea;
}

export interface FitCoordinatesParams {
	visibleArea: VisibleArea;
	coordinates: Coordinates;
	aspectRatio: AspectRatio;
	sizeRestrictions: SizeRestrictions;
	positionRestrictions: PositionRestrictions;
}

export function fitCoordinates(params: FitCoordinatesParams): Coordinates {
	const {
		visibleArea,
		coordinates: previousCoordinates,
		aspectRatio,
		sizeRestrictions,
		positionRestrictions,
	} = params;

	let coordinates = { ...previousCoordinates };
	if (coordinates && coordinates.width && coordinates.height) {
		coordinates = {
			...coordinates,
			...approximateSize({
				width: coordinates.width,
				height: coordinates.height,
				aspectRatio,
				sizeRestrictions: {
					maxWidth: visibleArea.width,
					maxHeight: visibleArea.height,
					minHeight: Math.min(visibleArea.height, sizeRestrictions.minHeight),
					minWidth: Math.min(visibleArea.width, sizeRestrictions.minWidth),
				},
			}),
		};

		coordinates = applyMove(coordinates, diff(getCenter(previousCoordinates), getCenter(coordinates)));

		coordinates = applyMove(coordinates, fit(coordinates, positionRestrictions));
	}
	return coordinates;
}

interface DefaultVisibleAreaParams {
	imageSize: Size;
	boundaries: Size;
}
export function defaultVisibleArea(params: DefaultVisibleAreaParams): VisibleArea {
	const { imageSize, boundaries } = params;

	const imageRatio = ratio(imageSize);
	const boundaryRatio = ratio(boundaries);

	const areaProperties = {
		height: imageRatio > boundaryRatio ? imageSize.height : imageSize.width / boundaryRatio,
		width: imageRatio > boundaryRatio ? imageSize.height * boundaryRatio : imageSize.width,
	};

	return {
		left: imageSize.width / 2 - areaProperties.width / 2,
		top: imageSize.height / 2 - areaProperties.height / 2,
		width: areaProperties.width,
		height: areaProperties.height,
	};
}

interface InitStretcherParams {
	stretcher: HTMLElement;
	imageSize: Size;
}
export function initStretcher({ stretcher, imageSize }: InitStretcherParams): void {
	const aspectRatio = ratio(imageSize);

	if (imageSize.height > imageSize.width) {
		stretcher.style.height = `${imageSize.height}px`;
		stretcher.style.width = `${stretcher.clientHeight * aspectRatio}px`;
		if (stretcher.clientWidth / stretcher.clientHeight !== aspectRatio) {
			stretcher.style.height = `${stretcher.clientWidth / aspectRatio}px`;
		}
	} else {
		stretcher.style.width = `${imageSize.width}px`;
		stretcher.style.height = `${stretcher.clientWidth / aspectRatio}px`;
		if (stretcher.clientHeight / stretcher.clientWidth !== aspectRatio) {
			stretcher.style.width = `${stretcher.clientHeight * aspectRatio}px`;
		}
	}
}

interface DefaultBoundariesParams {
	cropper: HTMLElement;
	imageSize: Size;
}
export function defaultBoundaries({ cropper, imageSize }: DefaultBoundariesParams): Boundaries {
	const areaHeight = cropper.clientHeight;
	const areaWidth = cropper.clientWidth;

	let currentHeight = areaHeight;
	let currentWidth = (imageSize.width * areaHeight) / imageSize.height;

	if (currentWidth > areaWidth) {
		currentWidth = areaWidth;
		currentHeight = (imageSize.height * areaWidth) / imageSize.width;
	}

	return {
		width: currentWidth,
		height: currentHeight,
	};
}

export function joinLimits(a: Limits, b: Limits): Limits {
	const limits: Limits = {};
	ALL_DIRECTIONS.forEach((direction) => {
		const firstDirection = a[direction];
		const secondDirection = b[direction];
		if (firstDirection !== undefined && secondDirection !== undefined) {
			if (direction === 'left' || direction === 'top') {
				limits[direction] = Math.max(firstDirection, secondDirection);
			} else {
				limits[direction] = Math.min(firstDirection, secondDirection);
			}
		} else if (secondDirection) {
			limits[direction] = secondDirection;
		} else if (firstDirection) {
			limits[direction] = firstDirection;
		}
	});
	return limits;
}

export function limitBy(limits: Limits, object: Coordinates): Limits {
	return joinLimits(limits, toLimits(object));
}

interface PositionRestrictionsParams {
	imageRestriction: ImageRestriction;
	imageSize: Size;
}
export function positionRestrictions({ imageSize, imageRestriction }: PositionRestrictionsParams): Limits {
	let limits = {};

	if (imageRestriction !== 'none') {
		limits = {
			left: 0,
			top: 0,
			right: imageSize.width,
			bottom: imageSize.height,
		};
	}

	return limits;
}

interface AreaRestrictionsParams {
	imageRestriction: ImageRestriction;
	imageSize: Size;
}
export function areaRestrictions({ imageSize, imageRestriction }: AreaRestrictionsParams): Limits {
	let limits = {};

	if (imageRestriction === 'area') {
		limits = {
			left: 0,
			top: 0,
			right: imageSize.width,
			bottom: imageSize.height,
		};
	}

	return limits;
}

export interface DefaultPositionParams {
	visibleArea: VisibleArea;
	coordinates: Size;
}
export function defaultPosition({ visibleArea, coordinates }: DefaultPositionParams): Point {
	return {
		left: visibleArea.left + visibleArea.width / 2 - coordinates.width / 2,
		top: visibleArea.top + visibleArea.height / 2 - coordinates.height / 2,
	};
}

export interface DefaultSizeParams {
	visibleArea: VisibleArea;
	aspectRatio: AspectRatio;
	sizeRestrictions: SizeRestrictions;
}
export function defaultSize({ visibleArea, aspectRatio, sizeRestrictions }: DefaultSizeParams): Size {
	return approximateSize({
		width: visibleArea.width * 0.8,
		height: visibleArea.height * 0.8,
		aspectRatio,
		sizeRestrictions: {
			...sizeRestrictions,
			maxWidth: Math.min(visibleArea.width, sizeRestrictions.maxWidth),
			maxHeight: Math.min(visibleArea.height, sizeRestrictions.maxHeight),
		},
	});
}

interface PercentRestrictionParams {
	imageSize: Size;
	minWidth: number;
	minHeight: number;
	maxWidth: number;
	maxHeight: number;
}
export function percentRestrictions({
	imageSize,
	minWidth,
	minHeight,
	maxWidth,
	maxHeight,
}: PercentRestrictionParams): SizeRestrictions {
	return {
		minWidth: (minWidth / 100) * imageSize.width,
		minHeight: (minHeight / 100) * imageSize.height,
		maxWidth: (maxWidth / 100) * imageSize.width,
		maxHeight: (maxHeight / 100) * imageSize.height,
	};
}

interface RoundCoordinatesParams {
	coordinates: Coordinates;
	sizeRestrictions: SizeRestrictions;
	positionRestrictions: PositionRestrictions;
}
export function roundCoordinates({
	coordinates,
	sizeRestrictions,
	positionRestrictions,
}: RoundCoordinatesParams): Coordinates {
	const roundedCoordinates = {
		width: Math.round(coordinates.width),
		height: Math.round(coordinates.height),
		left: Math.round(coordinates.left),
		top: Math.round(coordinates.top),
	};

	if (roundedCoordinates.width > sizeRestrictions.maxWidth) {
		roundedCoordinates.width = Math.floor(coordinates.width);
	} else if (roundedCoordinates.width < sizeRestrictions.minWidth) {
		roundedCoordinates.width = Math.ceil(coordinates.width);
	}
	if (roundedCoordinates.height > sizeRestrictions.maxHeight) {
		roundedCoordinates.height = Math.floor(coordinates.height);
	} else if (roundedCoordinates.height < sizeRestrictions.minHeight) {
		roundedCoordinates.height = Math.ceil(coordinates.height);
	}
	if (
		positionRestrictions.left !== undefined &&
		(roundedCoordinates.left < positionRestrictions.left ||
			(positionRestrictions.right !== undefined &&
				roundedCoordinates.left + roundedCoordinates.width > positionRestrictions.right))
	) {
		roundedCoordinates.left = Math.floor(positionRestrictions.left);
	}
	if (
		positionRestrictions.top !== undefined &&
		(roundedCoordinates.top < positionRestrictions.top ||
			(positionRestrictions.bottom !== undefined &&
				roundedCoordinates.top + roundedCoordinates.height > positionRestrictions.bottom))
	) {
		roundedCoordinates.top = Math.floor(positionRestrictions.top);
	}

	return roundedCoordinates;
}

interface NormalizeEventParams {
	event: ResizeEvent | MoveEvent | ManipulateImageEvent;
	visibleArea: VisibleArea;
	coefficient: number;
}
export function normalizeEvent({ event, visibleArea, coefficient }: NormalizeEventParams) {
	if (event.type === 'manipulateImage') {
		return {
			...event,
			move: {
				left: event.move.left ? coefficient * event.move.left : 0,
				top: event.move.top ? coefficient * event.move.top : 0,
			},
			scale: {
				factor: event.scale.factor || 1,
				center: event.scale.center
					? {
							left: event.scale.center.left * coefficient + visibleArea.left,
							top: event.scale.center.top * coefficient + visibleArea.top,
					  }
					: null,
			},
		};
	} else if (event.type === 'resize') {
		const normalizedEvent = { ...event };
		MAIN_DIRECTIONS.forEach((direction) => {
			normalizedEvent.directions[direction] *= coefficient;
		});
		return normalizedEvent;
	} else if (event.type === 'move') {
		const normalizedEvent = { ...event };
		MAIN_DIRECTIONS.forEach((direction) => {
			normalizedEvent.directions[direction] *= coefficient;
		});
		return normalizedEvent;
	} else {
		return event;
	}
}

interface RefineVisibleAreaParams {
	visibleArea: VisibleArea;
	boundaries: Boundaries;
}
export function refineVisibleArea({ visibleArea, boundaries }: RefineVisibleAreaParams): VisibleArea {
	const result = { ...visibleArea };
	const boundariesRatio = ratio(boundaries);
	if (result.width / result.height !== boundariesRatio) {
		result.height = result.width / boundariesRatio;
	}
	return result;
}

interface RefineStencilRestrictionsParams {
	sizeRestrictions: Partial<SizeRestrictions>;
	positionRestrictions: PositionRestrictions;
	visibleArea: VisibleArea;
	boundaries: Boundaries;
	imageSize: Size;
	imageRestriction: ImageRestriction;
}
export function refineSizeRestrictions({
	sizeRestrictions,
	imageSize,
	visibleArea,
	positionRestrictions,
	imageRestriction = 'none',
}: RefineStencilRestrictionsParams) {
	const restrictions = {
		...sizeRestrictions,
		minWidth: sizeRestrictions.minWidth !== undefined ? sizeRestrictions.minWidth : 0,
		minHeight: sizeRestrictions.minHeight !== undefined ? sizeRestrictions.minHeight : 0,
		maxWidth: sizeRestrictions.maxWidth !== undefined ? sizeRestrictions.maxWidth : Infinity,
		maxHeight: sizeRestrictions.maxHeight !== undefined ? sizeRestrictions.maxHeight : Infinity,
	};


	// 1. The situation, when stencil can't be positioned in cropper due to positionRestrictions should be avoided
	if (positionRestrictions.left !== undefined && positionRestrictions.right !== undefined) {
		restrictions.maxWidth = Math.min(restrictions.maxWidth, positionRestrictions.right - positionRestrictions.left);
	}
	if (positionRestrictions.bottom !== undefined && positionRestrictions.top !== undefined) {
		restrictions.maxHeight = Math.min(
			restrictions.maxHeight,
			positionRestrictions.bottom - positionRestrictions.top,
		);
	}

	// 2. The situation when stencil larger than maximum visible area or image should be avoided if imageRestriction != 'none':
	if (imageRestriction !== 'none') {
		const areaMaximum = fitSize(visibleArea, imageSize);
		const maxWidth = imageRestriction === 'area' ? areaMaximum.width : imageSize.width;
		const maxHeight = imageRestriction === 'area' ? areaMaximum.height : imageSize.height;
		if (!restrictions.maxWidth || restrictions.maxWidth > maxWidth) {
			restrictions.maxWidth = maxWidth;
		}
		if (!restrictions.maxHeight || restrictions.maxHeight > maxHeight) {
			restrictions.maxHeight = maxHeight;
		}
	}

	if (restrictions.minWidth > restrictions.maxWidth) {
		if (process.env.NODE_ENV !== 'production') {
			console.warn(
				`Warning: maximum width (${restrictions.maxWidth}px) fewer that the minimum width (${restrictions.minWidth}px). It is set equal to the minimum width and width resizing was blocked`,
			);
		}
		restrictions.maxWidth = restrictions.minWidth;
		restrictions.widthFrozen = true;
	}

	if (restrictions.minHeight > restrictions.maxHeight) {
		if (process.env.NODE_ENV !== 'production') {
			console.warn(
				`Warning: maximum height (${restrictions.maxHeight}px) fewer that the minimum height (${restrictions.minHeight}px). It is set equal to the minimum height and height resizing was blocked`,
			);
		}
		restrictions.maxHeight = restrictions.minHeight;
		restrictions.heightFrozen = true;
	}

	// Stencil should not be larger than visible area anyway
	restrictions.minWidth = Math.min(restrictions.minWidth, visibleArea.width);
	restrictions.minHeight = Math.min(restrictions.minHeight, visibleArea.height);

	return restrictions;
}
