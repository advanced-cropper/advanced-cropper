import { Coordinates, CoreSettings, CropperState, InitializedCropperState } from '../types';
import { emptyCoordinates, isFunction } from '../utils';
import {
	createAspectRatio,
	getBrokenRatio,
	isConsistentPosition,
	isConsistentSize,
	moveToPositionRestrictions,
	ratio,
	rotateSize,
} from './utils';
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
export function getRoundedCoordinates(state: CropperState, settings: CoreSettings): Coordinates | null {
	if (isInitializedState(state)) {
		const sizeRestrictions = getSizeRestrictions(state, settings);

		const positionRestrictions = getPositionRestrictions(state, settings);

		const roundCoordinates = {
			width: Math.round(state.coordinates.width),
			height: Math.round(state.coordinates.height),
			left: Math.round(state.coordinates.left),
			top: Math.round(state.coordinates.top),
		};

		if (roundCoordinates.width > sizeRestrictions.maxWidth) {
			roundCoordinates.width = Math.floor(state.coordinates.width);
		} else if (roundCoordinates.width < sizeRestrictions.minWidth) {
			roundCoordinates.width = Math.ceil(state.coordinates.width);
		}
		if (roundCoordinates.height > sizeRestrictions.maxHeight) {
			roundCoordinates.height = Math.floor(state.coordinates.height);
		} else if (roundCoordinates.height < sizeRestrictions.minHeight) {
			roundCoordinates.height = Math.ceil(state.coordinates.height);
		}

		return moveToPositionRestrictions(roundCoordinates, positionRestrictions);
	} else {
		return null;
	}
}

export function isConsistentState(state: CropperState, settings: CoreSettings) {
	if (isInitializedState(state)) {
		return (
			!getBrokenRatio(ratio(state.coordinates), getAspectRatio(state, settings)) &&
			isConsistentSize(state.visibleArea, getAreaSizeRestrictions(state, settings)) &&
			isConsistentSize(state.coordinates, getSizeRestrictions(state, settings)) &&
			isConsistentPosition(state.visibleArea, getAreaPositionRestrictions(state, settings)) &&
			isConsistentPosition(state.coordinates, getPositionRestrictions(state, settings))
		);
	} else {
		return true;
	}
}
