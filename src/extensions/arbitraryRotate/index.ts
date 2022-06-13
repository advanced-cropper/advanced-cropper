import { fitCircleToImage, fitRectangleToImage } from './position';
import { fittedCircleSize, fittedRectangleSize } from './size';
import { resizeCoordinatesAlgorithm } from '../../algorithms';
import {
	applyMove,
	applyScale, approximateSize,
	coordinatesToPositionRestrictions,
	diff,
	getAspectRatio,
	getCenter,
	getMinimumSize,
	getPositionRestrictions,
	getSizeRestrictions,
	isInitializedState,
	mergePositionRestrictions,
	ratio,
} from '../../service';
import { CoreSettings, CropperState, ImageTransform, PostprocessAction, ResizeDirections, Size } from '../../types';
import { copyState, ResizeOptions, transformImage } from '../../state';
import { BoundingBox, BoundingBoxFunction, toBoundingBox } from './boundingBox';

export interface ArbitraryRotateSettings extends CoreSettings {
	boundingBox?: BoundingBox | BoundingBoxFunction;
}

export function customResizeCoordinates(
	state: CropperState,
	settings: CoreSettings,
	directions: ResizeDirections,
	options: ResizeOptions,
) {
	const minimumSize = getMinimumSize(state);
	if (isInitializedState(state)) {
		return {
			...state,
			coordinates: resizeCoordinatesAlgorithm(state.coordinates, directions, options, {
				positionRestrictions: mergePositionRestrictions(
					getPositionRestrictions(state, settings),
					coordinatesToPositionRestrictions(state.visibleArea),
				),
				sizeRestrictions: {
					minWidth: minimumSize,
					minHeight: minimumSize,
					maxWidth: state.visibleArea.width,
					maxHeight: state.visibleArea.height,
				},
				aspectRatio: getAspectRatio(state, settings),
			}),
		};
	}
	return state;
}

export function customTransformImage(state: CropperState, settings: CoreSettings, transform: ImageTransform) {
	const { flip, ...otherTransforms } = transform;
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

	return transformImage(state, settings, otherTransforms);
}

export function getDefaultVisibleArea(state: CropperState) {
	const { imageSize, boundary } = state;

	if (imageSize.width / imageSize.height > boundary.width / boundary.height) {
		const width = imageSize.width;
		const height = width / (boundary.width / boundary.height);

		return {
			width,
			height,
			left: 0,
			top: imageSize.height / 2 - height / 2,
		};
	} else {
		const height = imageSize.height;
		const width = (boundary.width / boundary.height) * height;

		return {
			width,
			height,
			left: imageSize.width / 2 - width / 2,
			top: 0,
		};
	}
}

export function getDefaultSize(state: CropperState) {
	const { imageSize } = state;

	return {
		width: imageSize.width,
		height: imageSize.height,
	};
}

export function mobileAutoZoom(
	state: CropperState,
	settings: CoreSettings & { boundingBox: BoundingBox | BoundingBoxFunction },
	action: PostprocessAction,
) {
	if (action.immediately && isInitializedState(state)) {
		const result = copyState(state);
		const boundingBox = toBoundingBox(state, settings);

		if (boundingBox) {
			const angle = state.transforms.rotate;

			const aspectRatio = getAspectRatio(result, settings);

			const boundingBoxAspectRatio = {
				minimum:
					(aspectRatio.minimum * Math.cos(angle) + Math.sin(angle)) /
					(aspectRatio.minimum * Math.sin(angle) + Math.cos(angle)),
				maximum:
					(aspectRatio.maximum * Math.cos(angle) + Math.sin(angle)) /
					(aspectRatio.maximum * Math.sin(angle) + Math.cos(angle)),
			};

			const size = approximateSize({
				width: boundingBox.width,
				height: boundingBox.height,
				aspectRatio: boundingBoxAspectRatio,
				sizeRestrictions: getSizeRestrictions(result, settings),
			};
		})

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
		result.coordinates = applyMove(
			result.coordinates,
			(stencilType === 'circle' ? fitCircleToImage : fitRectangleToImage)(result.coordinates, {
				...state.imageSize,
				angle: state.transforms.rotate,
			}),
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
