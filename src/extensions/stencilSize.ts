import { BivarianceConstraint, CoreSettings, CropperState, PostprocessAction, RawAspectRatio, Size } from '../types';
import {
	applyMove,
	applyScale,
	approximateSize,
	aspectRatioIntersection,
	coordinatesToPositionRestrictions,
	createAspectRatio,
	diff,
	fitToSizeRestrictions,
	getAreaPositionRestrictions,
	getAreaSizeRestrictions,
	getAspectRatio,
	getCenter,
	getSizeRestrictions,
	isInitializedState,
	mergePositionRestrictions,
	moveToPositionRestrictions,
	ratio,
} from '../service';
import { isFunction } from '../utils';
import { copyState } from '../state';
import { defaultStencilConstraints } from '../defaults';

export type StencilSize<Settings = CoreSettings> =
	| Size
	| BivarianceConstraint<(state: CropperState, props: Settings) => Size>;

export interface FixedStencilSettings extends CoreSettings {
	stencilSize: StencilSize<this>;
}

export function fixedStencilConstraints(
	rawSettings: {
		stencilSize: StencilSize<FixedStencilSettings>;
	},
	stencilOptions: {
		aspectRatio?: (() => RawAspectRatio) | RawAspectRatio;
	},
) {
	const defaultConstraints = defaultStencilConstraints({}, stencilOptions);

	return {
		stencilSize(state: CropperState, settings: FixedStencilSettings) {
			const previousSize = isFunction(rawSettings.stencilSize)
				? rawSettings.stencilSize(state, settings)
				: rawSettings.stencilSize;

			return approximateSize({
				...previousSize,
				aspectRatio: aspectRatioIntersection(
					defaultConstraints.aspectRatio,
					createAspectRatio(ratio(previousSize)),
				),
			});
		},
	};
}

export function getStencilSize(state: CropperState, settings: FixedStencilSettings) {
	const { boundary } = state;

	let size = isFunction(settings.stencilSize) ? settings.stencilSize(state, settings) : settings.stencilSize;

	if (size.width > boundary.width || size.height > boundary.height) {
		size = approximateSize({
			sizeRestrictions: {
				maxWidth: boundary.width,
				maxHeight: boundary.height,
				minWidth: 0,
				minHeight: 0,
			},
			width: size.width,
			height: size.height,
			aspectRatio: {
				minimum: ratio(size),
				maximum: ratio(size),
			},
		});
	}

	return size;
}

export function sizeRestrictions(state: CropperState, settings: FixedStencilSettings) {
	const stencilSize = getStencilSize(state, {
		...settings,
		stencilSize: settings.stencilSize,
	});

	const areaRestrictions = getAreaSizeRestrictions(state, settings);

	return {
		maxWidth: (areaRestrictions.maxWidth * stencilSize.width) / state.boundary.width,
		maxHeight: (areaRestrictions.maxHeight * stencilSize.height) / state.boundary.height,
		minWidth: 0,
		minHeight: 0,
	};
}

export function defaultSize(state: CropperState, settings: FixedStencilSettings): Size {
	const { imageSize, visibleArea, boundary } = state;

	const sizeRestrictions = getSizeRestrictions(state, settings);

	const aspectRatio = getAspectRatio(state, settings);

	const stencilSize = isFunction(settings.stencilSize) ? settings.stencilSize(state, settings) : settings.stencilSize;

	const area = (visibleArea || imageSize) as Size;

	let height, width;
	if (ratio(area) > ratio(boundary)) {
		height = (stencilSize.height * area.height) / boundary.height;
		width = height * ratio(stencilSize);
	} else {
		width = (stencilSize.width * area.width) / boundary.width;
		height = width / ratio(stencilSize);
	}

	return approximateSize({
		width,
		height,
		aspectRatio,
		sizeRestrictions,
	});
}

export function aspectRatio(state: CropperState, settings: FixedStencilSettings) {
	const value = ratio(getStencilSize(state, settings));
	return {
		minimum: value,
		maximum: value,
	};
}

export function fixedStencilAlgorithm(state: CropperState, settings: FixedStencilSettings): CropperState {
	if (isInitializedState(state)) {
		const result = copyState(state);

		const stencil = getStencilSize(state, settings);

		// First of all try to resize visible area as much as possible:
		result.visibleArea = applyScale(
			result.visibleArea,
			(result.coordinates.width * result.boundary.width) / (result.visibleArea.width * stencil.width),
		);

		// Check that visible area doesn't break the area restrictions:
		const scale = fitToSizeRestrictions(result.visibleArea, getAreaSizeRestrictions(result, settings));
		if (scale !== 1) {
			result.visibleArea = applyScale(result.visibleArea, scale);
			result.coordinates = applyScale(result.coordinates, scale);
		}

		result.visibleArea = applyMove(
			result.visibleArea,
			diff(getCenter(result.coordinates), getCenter(result.visibleArea)),
		);

		// Center stencil in visible area:
		result.visibleArea = moveToPositionRestrictions(
			result.visibleArea,
			getAreaPositionRestrictions(result, settings),
		);
		result.coordinates = moveToPositionRestrictions(
			result.coordinates,
			mergePositionRestrictions(
				coordinatesToPositionRestrictions(result.visibleArea),
				getAreaPositionRestrictions(result, settings),
			),
		);

		return result;
	}
	return state;
}

export function fixedStencil(
	state: CropperState,
	settings: FixedStencilSettings,
	action?: PostprocessAction,
): CropperState {
	if (action && action.immediately) {
		return fixedStencilAlgorithm(state, settings);
	}
	return state;
}
