import {
	approximateSize,
	fitToSizeRestrictions,
	mergeSizeRestrictions,
	ratio,
	rotateSize,
	sizeDistance,
} from '../../service';
import { AspectRatio, Size, SizeRestrictions } from '../../types';
import { isGreater, isLower } from '../../utils';
import { BoundingBox, BoundingBoxFunction, BoundingBoxTypes, getBoundingBox } from './boundingBox';

interface Image {
	width: number;
	height: number;
	angle: number;
}
export function imageToSizeRestrictions(image: Image, aspectRatio: number, boundingBox: BoundingBox): SizeRestrictions {
	const wrapper = getBoundingBox(
		{
			width: aspectRatio,
			height: 1,
		},
		image.angle,
		boundingBox,
	);

	if (image.width / image.height >= wrapper.width / wrapper.height) {
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

function validateSize(params: {
	size: Size;
	aspectRatio: AspectRatio;
	sizeRestrictions: SizeRestrictions;
	image: Image;
	boundingBox: BoundingBox;
	ignoreMinimum?: boolean;
}) {
	const { size, aspectRatio, ignoreMinimum, image, boundingBox } = params;

	const sizeRestrictions =
		size.width > 0 && size.height > 0
			? mergeSizeRestrictions(params.sizeRestrictions, imageToSizeRestrictions(image, ratio(size), boundingBox))
			: params.sizeRestrictions;

	return (
		!isLower(ratio(size), aspectRatio.minimum) &&
		!isGreater(ratio(size), aspectRatio.maximum) &&
		!isGreater(size.height, Math.ceil(sizeRestrictions.maxHeight)) &&
		!isGreater(size.width, Math.ceil(sizeRestrictions.maxWidth)) &&
		size.width &&
		size.height &&
		(ignoreMinimum || (size.height >= sizeRestrictions.minHeight && size.width >= sizeRestrictions.minWidth))
	);
}

export function fittedToImageSize(params: {
	width: number;
	height: number;
	image: Image;
	sizeRestrictions: SizeRestrictions;
	aspectRatio?: AspectRatio;
	boundingBox?: BoundingBox;
}): Size {
	const { width, height, image, boundingBox = BoundingBoxTypes.Rectangle } = params;

	// непонятно зачем так сделано
	const rotatedImageSize = rotateSize(image, image.angle);

	const sizeRestrictions = mergeSizeRestrictions(params.sizeRestrictions, {
		maxHeight: rotatedImageSize.height,
		maxWidth: rotatedImageSize.width,
	});

	// просто нормализация aspect ratio
	const aspectRatio = {
		minimum: (params.aspectRatio && params.aspectRatio.minimum) || 0,
		maximum: (params.aspectRatio && params.aspectRatio.maximum) || Infinity,
	};

	// пробуем разместить указанные координаты с попавкой на минимальное значение
	const coordinates = {
		width: Math.max(sizeRestrictions.minWidth, width),
		height: Math.max(sizeRestrictions.minHeight, height),
	};

	// просто функция отбора кандидатов
	function findBestCandidate(candidates: Size[], ignoreMinimum = false): Size | null {
		return candidates.reduce<Size | null>((minimum: Size | null, size: Size) => {
			if (validateSize({ size, aspectRatio, sizeRestrictions, image, ignoreMinimum, boundingBox })) {
				return !minimum || sizeDistance(size, { width, height }) < sizeDistance(minimum, { width, height })
					? size
					: minimum;
			} else {
				return minimum;
			}
		}, null);
	}

	// Bounding box ограничений для текущих координат
	const angleRestrictions = imageToSizeRestrictions(
		image,
		Math.min(aspectRatio.maximum, Math.max(aspectRatio.minimum, ratio(coordinates))),
		boundingBox,
	);

	// Рассматриваем как теущий размер, так и обрубленный максимальным bounding box:
	let candidates: Size[] = [
		coordinates,
		{
			width: Math.min(sizeRestrictions.maxWidth, angleRestrictions.maxWidth),
			height: Math.min(sizeRestrictions.maxHeight, angleRestrictions.maxHeight),
		},
	];

	// Если есть ограничения на соотношения сторон
	if (aspectRatio) {
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
	}

	// Resize the candidates as much as possible to prevent breaking minimum size
	candidates = candidates.map((candidate) => {
		const coefficient = fitToSizeRestrictions(
			candidate,
			mergeSizeRestrictions(imageToSizeRestrictions(image, ratio(candidate), boundingBox), sizeRestrictions),
		);

		return {
			...candidate,
			width: candidate.width * coefficient,
			height: candidate.height * coefficient,
		};
	});

	const candidate = findBestCandidate(candidates) || findBestCandidate(candidates, true);

	return (candidate && {
		width: candidate.width,
		height: candidate.height,
	}) as Size;
}

export function fittedCircleSize(params: {
	width: number;
	height: number;
	image: Image;
	sizeRestrictions: SizeRestrictions;
	aspectRatio?: AspectRatio;
}): Size {
	return approximateSize({
		width: params.width,
		height: params.height,
		sizeRestrictions: mergeSizeRestrictions(params.sizeRestrictions, {
			maxWidth: params.image.width,
			maxHeight: params.image.height,
		}),
		aspectRatio: params.aspectRatio,
	});
}
