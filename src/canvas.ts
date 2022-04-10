import { Coordinates, CropperState, Size, Transforms } from './types';
import { getCenter, rotatePoint, rotateSize, approximateSize, isInitializedState } from './service';
import { isNumeric } from './utils';

interface UpdateOptions {
	imageSmoothingQuality?: 'low' | 'medium' | 'high';
	imageSmoothingEnabled?: boolean;
	fillColor?: string;
}

export function prepareSource(canvas: HTMLCanvasElement, image: HTMLImageElement, { rotate, flip }: Transforms) {
	const originalSize = {
		width: image.naturalWidth,
		height: image.naturalHeight,
	};

	const transformedSize = rotateSize(originalSize, rotate);

	const ctx = canvas.getContext('2d');
	canvas.height = transformedSize.height;
	canvas.width = transformedSize.width;

	if (ctx) {
		ctx.save();

		// Rotation:
		const canvasCenter = rotatePoint(
			getCenter({
				left: 0,
				top: 0,
				...originalSize,
			}),
			rotate,
		);

		ctx.translate(
			-(canvasCenter.left - transformedSize.width / 2),
			-(canvasCenter.top - transformedSize.height / 2),
		);
		ctx.rotate((rotate * Math.PI) / 180);

		// Reflection;
		ctx.translate(flip.horizontal ? originalSize.width : 0, flip.vertical ? originalSize.height : 0);
		ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);

		ctx.drawImage(image, 0, 0, originalSize.width, originalSize.height);
		ctx.restore();
	}

	return canvas;
}

export function updateCanvas(
	canvas: HTMLCanvasElement,
	source: HTMLCanvasElement | HTMLImageElement,
	coordinates: Coordinates,
	resultSize?: Size,
	options?: UpdateOptions,
) {
	canvas.width = resultSize ? resultSize.width : coordinates.width;
	canvas.height = resultSize ? resultSize.height : coordinates.height;

	const ctx = canvas.getContext('2d');

	if (ctx) {
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		if (options) {
			if (options.imageSmoothingEnabled) {
				ctx.imageSmoothingEnabled = options.imageSmoothingEnabled;
			}
			if (options.imageSmoothingQuality) {
				ctx.imageSmoothingQuality = options.imageSmoothingQuality;
			}
			if (options.fillColor) {
				ctx.fillStyle = options.fillColor;
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				ctx.save();
			}
		}

		ctx.drawImage(
			source,
			coordinates.left,
			coordinates.top,
			coordinates.width,
			coordinates.height,
			0,
			0,
			canvas.width,
			canvas.height,
		);
	}

	return canvas;
}

export interface DrawOptions extends UpdateOptions {
	width?: number;
	height?: number;
	minWidth?: number;
	maxWidth?: number;
	minHeight?: number;
	maxHeight?: number;
	maxArea?: number;
}
export function drawCroppedArea(
	state: CropperState,
	image: HTMLImageElement,
	resultCanvas: HTMLCanvasElement,
	spareCanvas: HTMLCanvasElement,
	options: DrawOptions,
) {
	if (isInitializedState(state)) {
		const { transforms, coordinates } = state;

		const imageTransformed = transforms.rotate !== 0 || transforms.flip.horizontal || transforms.flip.vertical;

		const source = imageTransformed ? prepareSource(spareCanvas, image, transforms) : image;

		const params: DrawOptions = {
			minWidth: 0,
			minHeight: 0,
			maxWidth: Infinity,
			maxHeight: Infinity,
			maxArea: Infinity,
			imageSmoothingEnabled: true,
			imageSmoothingQuality: 'high',
			fillColor: 'transparent',
			...options,
		};

		const firstNumeric = (array: (number | undefined)[]) => array.find((el) => isNumeric(el));

		let size = approximateSize({
			sizeRestrictions: {
				minWidth: firstNumeric([params.width, params.minWidth]) || 0,
				minHeight: firstNumeric([params.height, params.minHeight]) || 0,
				maxWidth: firstNumeric([params.width, params.maxWidth]) || Infinity,
				maxHeight: firstNumeric([params.height, params.maxHeight]) || Infinity,
			},
			width: coordinates.width,
			height: coordinates.height,
			aspectRatio: {
				minimum: coordinates.width / coordinates.height,
				maximum: coordinates.width / coordinates.height,
			},
		});

		if (params.maxArea && size.width * size.height > params.maxArea) {
			const scale = Math.sqrt(params.maxArea / (size.width * size.height));
			size = {
				width: Math.round(scale * size.width),
				height: Math.round(scale * size.height),
			};
		}
		return updateCanvas(resultCanvas, source, coordinates, size, params);
	} else {
		return null;
	}
}
