import { CoreSettings, CropperState, InitializedCropperState } from '../types';
import { emptyCoordinates, isFunction } from '../utils';
import { createAspectRatio, rotateSize } from './utils';
import { calculateSizeRestrictions, calculateAreaSizeRestrictions } from './sizeRestrictions';

export function isInitializedState(state: CropperState | null): state is InitializedCropperState {
	return Boolean(state && state.visibleArea && state.coordinates);
}

export function getAreaSizeRestrictions(state: CropperState, settings: CoreSettings) {
	return calculateAreaSizeRestrictions(state, settings);
}

export function getAreaPositionRestrictions(state: CropperState, settings: CoreSettings) {
	return isFunction(settings.areaPositionRestrictions)
		? settings.areaPositionRestrictions(state, settings)
		: settings.areaPositionRestrictions;
}

export function getSizeRestrictions(state: CropperState, settings: CoreSettings) {
	return calculateSizeRestrictions(state, settings);
}

export function getPositionRestrictions(state: CropperState, settings: CoreSettings) {
	return isFunction(settings.positionRestrictions)
		? settings.positionRestrictions(state, settings)
		: settings.positionRestrictions;
}

export function getCoefficient(state: CropperState) {
	return state.visibleArea ? state.visibleArea.width / state.boundary.width : 0;
}

export function getStencilCoordinates(state: CropperState | null) {
	if (isInitializedState(state)) {
		const { width, height, left, top } = state.coordinates;
		const coefficient = getCoefficient(state);
		return {
			width: width / coefficient,
			height: height / coefficient,
			left: (left - state.visibleArea.left) / coefficient,
			top: (top - state.visibleArea.top) / coefficient,
		};
	} else {
		return emptyCoordinates();
	}
}

export function getAspectRatio(state: CropperState, settings: CoreSettings) {
	return createAspectRatio(
		isFunction(settings.aspectRatio) ? settings.aspectRatio(state, settings) : settings.aspectRatio,
	);
}

export function getDefaultCoordinates(state: CropperState, settings: CoreSettings) {
	return isFunction(settings.defaultCoordinates)
		? settings.defaultCoordinates(state, settings)
		: settings.defaultCoordinates;
}

export function getDefaultVisibleArea(state: CropperState, settings: CoreSettings) {
	return isFunction(settings.defaultVisibleArea)
		? settings.defaultVisibleArea(state, settings)
		: settings.defaultVisibleArea;
}

export function getTransformedImageSize(state: CropperState) {
	if (state.imageSize && state.imageSize.width && state.imageSize.height) {
		return rotateSize(state.imageSize, state.transforms.rotate);
	} else {
		return {
			width: 0,
			height: 0,
		};
	}
}

export function getMinimumSize(state: CropperState) {
	// The magic number is the approximation of the handler size
	// Temporary solution that should be improved in the future
	return state.coordinates
		? Math.min(state.coordinates.width, state.coordinates.height, 20 * getCoefficient(state))
		: 1;
}
