import { CoreSettings, CropperState, ImageRestriction, InitializedCropperState } from '../../types';
import { DefaultSettings } from '../../defaults';
import { getMinimumSize, getSizeRestrictions, isInitializedState, ratio } from '../../service';
import { isGreater } from '../../utils';
import { StencilSize } from '../stencilSize';

function getMinimumVisibleAreaSize(
	state: InitializedCropperState,
	settings: DefaultSettings & {
		transformImage?: {
			adjustStencil?: boolean;
		};
	},
) {
	const minimumSize = getMinimumSize(state);

	// Extend the basic settings
	settings = {
		...settings,
		minWidth: Math.max(minimumSize, settings.minWidth || 0),
		minHeight: Math.max(minimumSize, settings.minHeight || 0),
	};

	const { coordinates, visibleArea } = state;

	const adjustStencil = settings?.transformImage?.adjustStencil;

	const aspectRatio = ratio(coordinates);

	const sizeRestrictions = getSizeRestrictions(state, settings);

	if (sizeRestrictions.minWidth > 0 && sizeRestrictions.minHeight > 0) {
		if (isGreater(aspectRatio, sizeRestrictions.minWidth / sizeRestrictions.minHeight)) {
			sizeRestrictions.minWidth = sizeRestrictions.minHeight * aspectRatio;
		} else {
			sizeRestrictions.minHeight = sizeRestrictions.minWidth / aspectRatio;
		}
	}

	const viewRatio = isGreater(ratio(visibleArea), ratio(coordinates))
		? visibleArea.height / coordinates.height
		: visibleArea.width / coordinates.width;

	let minSize = isGreater(ratio(visibleArea), sizeRestrictions.minWidth / sizeRestrictions.minHeight)
		? sizeRestrictions.minHeight
		: sizeRestrictions.minWidth;

	if (!adjustStencil) {
		minSize = minSize * viewRatio;
	}

	return Math.max(minSize, 1);
}

function getMaximumVisibleAreaSize(
	state: InitializedCropperState,
	settings: CoreSettings & {
		transformImage?: {
			adjustStencil?: boolean;
		};
	},
) {
	const { imageSize, boundary, coordinates, visibleArea } = state;

	const adjustStencil = settings?.transformImage?.adjustStencil;

	const aspectRatio = ratio(coordinates);

	const sizeRestrictions = getSizeRestrictions(state, settings);

	if (sizeRestrictions.maxWidth < Infinity && sizeRestrictions.maxHeight < Infinity) {
		if (isGreater(sizeRestrictions.maxWidth / sizeRestrictions.maxHeight, aspectRatio)) {
			sizeRestrictions.maxWidth = sizeRestrictions.maxHeight * aspectRatio;
		} else {
			sizeRestrictions.maxHeight = sizeRestrictions.maxWidth / aspectRatio;
		}
	} else {
		if (isGreater(ratio(imageSize), ratio(boundary))) {
			sizeRestrictions.maxWidth = imageSize.width;
			sizeRestrictions.maxHeight = sizeRestrictions.maxWidth / ratio(imageSize);
		} else {
			sizeRestrictions.maxHeight = imageSize.height;
			sizeRestrictions.maxWidth = sizeRestrictions.maxHeight * ratio(imageSize);
		}
	}

	const maximumVisibleAreaSize = {
		width: Infinity,
		height: Infinity,
	};

	const viewRatio = isGreater(ratio(visibleArea), ratio(coordinates))
		? visibleArea.height / coordinates.height
		: visibleArea.width / coordinates.width;

	if (isGreater(ratio(imageSize), ratio(coordinates))) {
		maximumVisibleAreaSize.height = sizeRestrictions.maxHeight * viewRatio;
		maximumVisibleAreaSize.width = maximumVisibleAreaSize.height * ratio(imageSize);
	} else {
		maximumVisibleAreaSize.width = sizeRestrictions.maxWidth * viewRatio;
		maximumVisibleAreaSize.height = maximumVisibleAreaSize.width / ratio(imageSize);
	}

	let maxSize = isGreater(ratio(visibleArea), sizeRestrictions.maxWidth / sizeRestrictions.maxHeight)
		? sizeRestrictions.maxHeight
		: sizeRestrictions.maxWidth;

	if (!adjustStencil) {
		maxSize = maxSize * viewRatio;
	}

	maxSize = Math.min(
		maxSize,
		isGreater(ratio(visibleArea), ratio(coordinates))
			? maximumVisibleAreaSize.height
			: maximumVisibleAreaSize.width,
	);

	return maxSize;
}

function getVisibleAreaSize(state: InitializedCropperState, settings: CoreSettings, absoluteZoom: number) {
	const minSize = getMinimumVisibleAreaSize(state, settings);
	const maxSize = getMaximumVisibleAreaSize(state, settings);

	return maxSize - absoluteZoom * (maxSize - minSize);
}

export function getAbsoluteZoom(
	state: CropperState | null,
	settings: CoreSettings & {
		imageRestriction?: ImageRestriction;
		stencilSize?: StencilSize;
		minWidth?: number;
		minHeight?: number;
		transformImage?: {
			adjustStencil?: boolean;
		};
	},
	normalized = true,
) {
	if (isInitializedState(state)) {
		const { coordinates, visibleArea } = state;

		const size = ratio(visibleArea) > ratio(coordinates) ? visibleArea.height : visibleArea.width;

		const minSize = getMinimumVisibleAreaSize(state, settings);
		const maxSize = getMaximumVisibleAreaSize(state, settings);

		// This simple linear formula defines that absolute zoom is equal:
		// - 0 when `size` is equal to `maxSize`
		// - 1 when `size` is equal to `minSize`
		const value = 1 - (size - minSize) / (maxSize - minSize);
		return normalized ? Math.min(1, Math.max(0, value)) : value;
	} else {
		return 0;
	}
}

export function getZoomFactor(state: CropperState | null, settings: CoreSettings, absoluteZoom: number) {
	if (isInitializedState(state)) {
		const currentAbsoluteZoom = getAbsoluteZoom(state, settings, false);

		return (
			getVisibleAreaSize(state, settings, currentAbsoluteZoom) / getVisibleAreaSize(state, settings, absoluteZoom)
		);
	} else {
		return 1;
	}
}
