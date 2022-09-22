import { CoreSettings, CropperState, ImageRestriction, InitializedCropperState, ModifierSettings } from '../../types';
import { DefaultSettings } from '../../defaults';
import {
	getAreaSizeRestrictions,
	getSizeRestrictions,
	getTransformedImageSize,
	isInitializedState,
	mergeSizeRestrictions,
	ratio,
} from '../../service';
import { isGreater } from '../../utils';
import { StencilSize } from '../stencil-size';

function getMinimumVisibleAreaWidth(
	state: InitializedCropperState,
	settings: CoreSettings & DefaultSettings & ModifierSettings,
) {
	const { coordinates, visibleArea } = state;

	const adjustStencil = settings?.transformImage?.adjustStencil && (settings.minWidth || settings.minHeight);

	// Extend the basic settings
	settings = {
		...settings,
		minWidth: Math.max(1, settings.minWidth || 0),
		minHeight: Math.max(1, settings.minHeight || 0),
	};

	// Prepare size restrictions
	const sizeRestrictions = getSizeRestrictions(state, settings);

	// Calculate the maximum visible area image size
	const basicAreaSizeRestrictions = getAreaSizeRestrictions(state, settings);

	// Calculate maximum allowed visible area
	const minimumCoordinatesScale = isGreater(
		sizeRestrictions.minWidth / sizeRestrictions.minHeight,
		ratio(coordinates),
	)
		? sizeRestrictions.minWidth / coordinates.width
		: sizeRestrictions.minHeight / coordinates.height;

	const minimumAllowedVisibleArea = {
		minHeight: visibleArea.height * minimumCoordinatesScale,
		minWidth: visibleArea.width * minimumCoordinatesScale,
	};

	let minimumVisibleArea;

	if (adjustStencil) {
		const coordinatesBox = isGreater(ratio(visibleArea), ratio(state.coordinates))
			? {
					minHeight: state.coordinates.height,
					minWidth: state.coordinates.height * ratio(visibleArea),
			  }
			: {
					minWidth: state.coordinates.width,
					minHeight: state.coordinates.width / ratio(visibleArea),
			  };
		minimumVisibleArea = mergeSizeRestrictions(basicAreaSizeRestrictions, {
			minWidth: Math.min(minimumAllowedVisibleArea.minWidth, coordinatesBox.minWidth),
			minHeight: Math.min(minimumAllowedVisibleArea.minHeight, coordinatesBox.minHeight),
		});
	} else {
		minimumVisibleArea = mergeSizeRestrictions(basicAreaSizeRestrictions, minimumAllowedVisibleArea);
	}
	return isGreater(minimumVisibleArea.minWidth / minimumVisibleArea.minHeight, ratio(visibleArea))
		? minimumVisibleArea.minHeight * ratio(visibleArea)
		: minimumVisibleArea.minWidth;
}

function getMaximumVisibleAreaWidth(
	state: InitializedCropperState,
	settings: CoreSettings & {
		transformImage?: {
			adjustStencil?: boolean;
		};
	},
) {
	const { coordinates, visibleArea } = state;

	const adjustStencil = settings?.transformImage?.adjustStencil;

	const aspectRatio = ratio(coordinates);

	const sizeRestrictions = getSizeRestrictions(state, settings);

	const transformedImageSize = getTransformedImageSize(state);

	// Adapt size restrictions:
	if (sizeRestrictions.maxWidth === Infinity) {
		sizeRestrictions.maxWidth = transformedImageSize.width;
	}
	if (sizeRestrictions.maxHeight === Infinity) {
		sizeRestrictions.maxHeight = transformedImageSize.height;
	}
	if (isGreater(sizeRestrictions.maxWidth / sizeRestrictions.maxHeight, aspectRatio)) {
		sizeRestrictions.maxWidth = sizeRestrictions.maxHeight * aspectRatio;
	} else {
		sizeRestrictions.maxHeight = sizeRestrictions.maxWidth / aspectRatio;
	}

	const basicAreaSizeRestrictions = getAreaSizeRestrictions(state, settings);

	const maximumCoordinatesScale = isGreater(
		sizeRestrictions.maxWidth / sizeRestrictions.maxHeight,
		ratio(coordinates),
	)
		? sizeRestrictions.maxWidth / coordinates.width
		: sizeRestrictions.maxHeight / coordinates.height;

	const maximumAllowedVisibleArea = {
		maxHeight: visibleArea.height * maximumCoordinatesScale,
		maxWidth: visibleArea.width * maximumCoordinatesScale,
	};

	let maximumVisibleArea;
	if (adjustStencil) {
		const imageBox = isGreater(ratio(visibleArea), ratio(transformedImageSize))
			? {
					maxHeight: transformedImageSize.height,
					maxWidth: transformedImageSize.height * ratio(visibleArea),
			  }
			: {
					maxWidth: transformedImageSize.width,
					maxHeight: transformedImageSize.height * ratio(visibleArea),
			  };
		maximumVisibleArea = mergeSizeRestrictions(basicAreaSizeRestrictions, {
			maxWidth: Math.max(maximumAllowedVisibleArea.maxWidth, imageBox.maxWidth),
			maxHeight: Math.max(maximumAllowedVisibleArea.maxHeight, imageBox.maxHeight),
		});
	} else {
		maximumVisibleArea = mergeSizeRestrictions(basicAreaSizeRestrictions, maximumAllowedVisibleArea);
	}

	return isGreater(maximumVisibleArea.maxWidth / maximumVisibleArea.maxHeight, ratio(visibleArea))
		? maximumVisibleArea.maxHeight * ratio(visibleArea)
		: maximumVisibleArea.maxWidth;
}

function getVisibleAreaSize(state: InitializedCropperState, settings: CoreSettings, absoluteZoom: number) {
	const minSize = getMinimumVisibleAreaWidth(state, settings);
	const maxSize = getMaximumVisibleAreaWidth(state, settings);

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
		const { visibleArea } = state;

		const minSize = getMinimumVisibleAreaWidth(state, settings);
		const maxSize = getMaximumVisibleAreaWidth(state, settings);

		// This simple linear formula defines that absolute zoom is equal:
		// - 0 when `size` is equal to `maxSize`
		// - 1 when `size` is equal to `minSize`
		const value = 1 - (visibleArea.width - minSize) / (maxSize - minSize);
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
