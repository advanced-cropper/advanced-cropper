import {
	createAspectRatio,
	getCloserSize,
	mergeSizeRestrictions,
	ratio,
	resizeToSizeRestrictions,
} from '../../service';
import { RawAspectRatio, Size, SizeRestrictions } from '../../types';
import { BoundingBox, BoundingBoxType, RotatedImage } from './types';
import { getBoundingBox } from './boundingBox';

interface Image {
	width: number;
	height: number;
	angle: number;
}
function imageToSizeRestrictions(image: Image, aspectRatio: number, boundingBox: BoundingBox): SizeRestrictions {
	const wrapper = getBoundingBox(
		{
			width: aspectRatio,
			height: 1,
		},
		image.angle,
		boundingBox,
	);

	if (ratio(image) >= ratio(wrapper)) {
		return {
			minWidth: 0,
			minHeight: 0,
			maxHeight: image.height / wrapper.height,
			maxWidth: (image.height / wrapper.height) * aspectRatio,
		};
	} else {
		return {
			minWidth: 0,
			minHeight: 0,
			maxHeight: image.width / wrapper.width,
			maxWidth: (image.width / wrapper.width) * aspectRatio,
		};
	}
}

export function approximateSizeInsideImage(params: {
	image: RotatedImage;
	width: number;
	height: number;
	sizeRestrictions: SizeRestrictions;
	aspectRatio?: RawAspectRatio;
	boundingBox?: BoundingBox;
}): Size {
	const { width, height, image, sizeRestrictions, boundingBox = BoundingBoxType.Rectangle } = params;

	const aspectRatio = createAspectRatio(params.aspectRatio);

	// Try to place the desired coordinates with respect to minimum size
	const coordinates = {
		width: Math.max(sizeRestrictions.minWidth, width),
		height: Math.max(sizeRestrictions.minHeight, height),
	};

	// Bounding box for the current coordinates
	const angleRestrictions = imageToSizeRestrictions(
		image,
		Math.min(aspectRatio.maximum, Math.max(aspectRatio.minimum, ratio(coordinates))),
		boundingBox,
	);

	// Consider the current size and the cropped by maximum bounding box size
	let candidates: Size[] = [
		coordinates,
		{
			width: Math.min(sizeRestrictions.maxWidth, angleRestrictions.maxWidth),
			height: Math.min(sizeRestrictions.maxHeight, angleRestrictions.maxHeight),
		},
	];

	// If we have some aspect ratio
	[aspectRatio.minimum, aspectRatio.maximum].forEach((ratio) => {
		if (ratio && ratio !== Infinity) {
			const fittedSizeRestrictions = mergeSizeRestrictions(
				sizeRestrictions,
				imageToSizeRestrictions(image, ratio, boundingBox),
			);

			const width = Math.min(coordinates.width, fittedSizeRestrictions.maxWidth);
			const height = Math.min(coordinates.height, fittedSizeRestrictions.maxHeight);

			candidates.push({ width, height: width / ratio }, { width: height * ratio, height });
		}
	});

	// Resize the candidates as much as possible to prevent breaking minimum size
	candidates = candidates.map((candidate) =>
		resizeToSizeRestrictions(
			candidate,
			mergeSizeRestrictions(imageToSizeRestrictions(image, ratio(candidate), boundingBox), sizeRestrictions),
		),
	);

	const candidate = getCloserSize(
		candidates,
		{ width, height },
		(size) => mergeSizeRestrictions(sizeRestrictions, imageToSizeRestrictions(image, ratio(size), boundingBox)),
		aspectRatio,
	);

	return candidate as Size;
}
