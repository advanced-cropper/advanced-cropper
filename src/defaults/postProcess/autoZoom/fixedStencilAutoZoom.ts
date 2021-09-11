import {
	applyMove,
	applyScale,
	diff,
	fitToSizeRestrictions,
	getAreaPositionRestrictions,
	getAreaSizeRestrictions,
	getCenter,
	mergePositionRestrictions,
	moveToPositionRestrictions,
	toLimits,
} from '../../../service';
import { CropperSettings, CropperState } from '../../../types';
import { getFixedStencilSize } from '../../helpers';
import { copyState } from '../../../state';
import { StencilSize } from '../../';

export function fixedStencilAutoZoomAlgorithm(
	state: CropperState,
	settings: CropperSettings & { stencilSize: StencilSize },
): CropperState {
	const result = copyState(state);

	const stencil = getFixedStencilSize(state, settings);

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
	result.visibleArea = moveToPositionRestrictions(result.visibleArea, getAreaPositionRestrictions(result, settings));
	result.coordinates = moveToPositionRestrictions(
		result.coordinates,
		mergePositionRestrictions(toLimits(result.visibleArea), getAreaPositionRestrictions(result, settings)),
	);

	return result;
}

export function fixedStencilAutoZoom(
	state: CropperState,
	settings: CropperSettings & { stencilSize: StencilSize },
	action: string,
): CropperState {
	const actions = [
		'create',
		'reconcile',
		'interactionEnd',
		'rotate',
		'zoom',
		'setBoundary',
		'setVisibleArea',
		'setCoordinates',
	];

	if (actions.indexOf(action) !== -1) {
		return fixedStencilAutoZoomAlgorithm(state, settings);
	}
	return state;
}
