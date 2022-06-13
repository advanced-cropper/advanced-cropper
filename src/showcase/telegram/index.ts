import {
	Coordinates,
	CoreSettings,
	CropperState,
	ImageTransform,
	InitializedCropperState,
	PostprocessAction,
	RawAspectRatio,
	ResizeDirections,
	Size,
} from '../../types';
import {
	applyMove,
	applyScale,
	coordinatesToPositionRestrictions,
	diff,
	fitToPositionRestrictions,
	getAspectRatio,
	getCenter,
	getMinimumSize,
	getPositionRestrictions,
	getSizeRestrictions,
	getTransformedImageSize,
	inverseMove,
	isInitializedState,
	mergePositionRestrictions,
	ratio,
} from '../../service';
import { copyState, ResizeOptions, transformImage as originalTransformImage } from '../../state';
import {
	approximateSizeInsideImage,
	BoundingBoxType,
	fitToImage,
	FitToImageSettings,
	moveToImage,
} from '../../extensions/fitToImage';
import { getRotatedImage } from '../../extensions/fitToImage/utils';
import { AbstractCropperPostprocess } from '../../instance';
import { resizeCoordinatesAlgorithm } from '../../algorithms';
import { deepCompare, isGreater } from '../../utils';
import { defaultStencilConstraints } from '../../defaults';

interface ExtendedState extends CropperState {
	basis?: Coordinates;
}

interface ExtendedInitializedState extends InitializedCropperState {
	basis?: Coordinates;
}

export function stencilConstraints(
	rawSettings: unknown,
	stencilOptions: {
		boundingBox?: BoundingBoxType;
		aspectRatio?: (() => RawAspectRatio) | RawAspectRatio;
	},
) {
	const defaultConstraints = defaultStencilConstraints({}, stencilOptions);

	return {
		stencilBoundingBox: stencilOptions.boundingBox,
		...defaultConstraints,
	};
}

export function transformImage(state: ExtendedState, settings: CoreSettings, transform: ImageTransform) {
	const { flip, rotate, scale, move } = transform;
	if (flip) {
		state = {
			...state,
			transforms: {
				...state.transforms,
				flip: {
					horizontal: flip.horizontal ? !state.transforms.flip.horizontal : state.transforms.flip.horizontal,
					vertical: flip.vertical ? !state.transforms.flip.vertical : state.transforms.flip.vertical,
				},
			},
		};
	}

	if (state.coordinates) {
		if (!flip && !scale && !move) {
			state.basis = state.basis || { ...state.coordinates };
		} else {
			state.basis = undefined;
		}
	}

	return originalTransformImage(state, settings, { rotate, move, scale });
}

export function resizeCoordinates(
	state: CropperState,
	settings: CoreSettings & FitToImageSettings,
	directions: ResizeDirections,
	options: ResizeOptions,
) {
	if (isInitializedState(state)) {
		const result = copyState(state);

		const minimumSize = getMinimumSize(result);

		const imageSize = getTransformedImageSize(result);

		const sizeRestrictions = getSizeRestrictions(result, settings);

		result.coordinates = resizeCoordinatesAlgorithm(result.coordinates, directions, options, {
			positionRestrictions: mergePositionRestrictions(
				getPositionRestrictions(result, settings),
				coordinatesToPositionRestrictions(result.visibleArea),
			),
			sizeRestrictions: {
				maxWidth: Math.min(sizeRestrictions.maxWidth, imageSize.width, result.visibleArea.width),
				maxHeight: Math.min(sizeRestrictions.maxHeight, imageSize.height, result.visibleArea.height),
				minWidth: Math.max(Math.min(sizeRestrictions.minWidth, result.visibleArea.width), minimumSize),
				minHeight: Math.max(Math.min(sizeRestrictions.minHeight, result.visibleArea.height), minimumSize),
			},
			aspectRatio: getAspectRatio(result, settings),
		});

		const resizedCoordinates = { ...result.coordinates };

		const approximatedSize = approximateSizeInsideImage({
			width: result.coordinates.width,
			height: result.coordinates.height,
			image: getRotatedImage(result),
			boundingBox: settings.stencilBoundingBox,
			aspectRatio: getAspectRatio(result, settings),
			sizeRestrictions: getSizeRestrictions(result, settings),
		});

		result.coordinates = {
			left: getCenter(resizedCoordinates).left - approximatedSize.width / 2,
			top: getCenter(resizedCoordinates).top - approximatedSize.height / 2,
			...approximatedSize,
		};

		if (isGreater(Math.abs(resizedCoordinates.height - result.coordinates.height), 0)) {
			result.visibleArea = applyScale(
				result.visibleArea,
				result.visibleArea.height /
					(result.visibleArea.height + resizedCoordinates.height - result.coordinates.height),
			);
		}

		const fitDirections = fitToImage(result.coordinates, getRotatedImage(result), settings.stencilBoundingBox);
		result.coordinates = applyMove(result.coordinates, fitDirections);
		result.visibleArea = applyMove(result.visibleArea, fitDirections);

		return result;
	}
	return state;
}

export function defaultSize(state: CropperState, settings: CoreSettings) {
	return {
		width: state.visibleArea ? state.visibleArea.width : state.imageSize.width,
		height: state.visibleArea ? state.visibleArea.height : state.imageSize.height,
	};
}

export function autoZoom(
	state: ExtendedState | ExtendedInitializedState,
	settings: CoreSettings & FitToImageSettings,
	action: PostprocessAction<AbstractCropperPostprocess>,
) {
	if (isInitializedState(state) && action.immediately) {
		const result = copyState(state);

		if (action.name !== 'transformImage' && action.name !== 'transformImageEnd') {
			if (!deepCompare(result.coordinates, result.basis)) {
				result.basis = undefined;
			}
		}

		const { stencilBoundingBox = BoundingBoxType.Rectangle } = settings;

		const desiredSize = result.basis ? result.basis : result.coordinates;

		const size = approximateSizeInsideImage({
			width: desiredSize.width,
			height: desiredSize.height,
			image: getRotatedImage(state),
			aspectRatio: getAspectRatio(result, settings),
			sizeRestrictions: getSizeRestrictions(result, settings),
			boundingBox: stencilBoundingBox,
		});

		const previousCenter = getCenter(result.coordinates);

		const currentCenter = getCenter({
			...result.coordinates,
			...size,
		});

		// Return to the original position adjusted for size's change
		result.coordinates = applyMove(
			{
				...result.coordinates,
				...size,
			},
			diff(previousCenter, currentCenter),
		);

		// Move to fit image
		result.coordinates = moveToImage(result.coordinates, getRotatedImage(result), stencilBoundingBox);
		result.visibleArea = applyMove(
			result.visibleArea,
			inverseMove(
				fitToPositionRestrictions(result.coordinates, coordinatesToPositionRestrictions(result.visibleArea)),
			),
		);

		// Auto size
		const stencil: Size = {
			width: 0,
			height: 0,
		};
		if (ratio(result.boundary) > ratio(result.coordinates)) {
			stencil.height = result.boundary.height;
			stencil.width = stencil.height * ratio(result.coordinates);
		} else {
			stencil.width = result.boundary.width;
			stencil.height = stencil.width * ratio(result.coordinates);
		}

		// First of all try to resize visible area as much as possible:
		result.visibleArea = applyScale(
			result.visibleArea,
			(result.coordinates.width * result.boundary.width) / (result.visibleArea.width * stencil.width),
		);

		if (ratio(result.boundary) > ratio(result.coordinates)) {
			result.visibleArea.top = result.coordinates.top;
			result.visibleArea.left =
				result.coordinates.left - result.visibleArea.width / 2 + result.coordinates.width / 2;
		} else {
			result.visibleArea.left = result.coordinates.left;
			result.visibleArea.top =
				result.coordinates.top - result.visibleArea.height / 2 + result.coordinates.height / 2;
		}

		return result;
	}

	return state;
}
