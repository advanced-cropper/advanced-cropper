import { Boundary, CropperSettings, CropperState } from '../types';
import { fitCoordinates } from '../service/fitCoordinates';
import {
	applyMove,
	applyScale,
	moveToPositionRestrictions,
	resizeToSizeRestrictions,
	inverseMove,
	ratio,
	toLimits,
	fitToPositionRestrictions,
} from '../service/utils';
import { copyState } from './copyState';
import { getAreaPositionRestrictions, getAreaSizeRestrictions, getSizeRestrictions } from '../service/helpers';

export type SetBoundaryAlgorithm = (state: CropperState, settings: CropperSettings, boundary: Boundary) => CropperState;

export function setBoundary(state: CropperState, settings: CropperSettings, boundary: Boundary) {
	let result = copyState(state);

	result.boundary = boundary;

	// Scale visible area size to fit new boundary:
	result.visibleArea.height = result.visibleArea.width / ratio(boundary);
	result.visibleArea.top += (state.visibleArea.height - result.visibleArea.height) / 2;

	// Scale visible area to prevent overlap coordinates (and its minimum size)
	const sizeRestrictions = getSizeRestrictions(result, settings);

	if (
		Math.max(sizeRestrictions.minHeight, result.coordinates.height) - result.visibleArea.height > 0 ||
		Math.max(sizeRestrictions.minWidth, result.coordinates.width) - result.visibleArea.width > 0
	) {
		result.visibleArea = applyScale(
			result.visibleArea,
			Math.max(
				Math.max(sizeRestrictions.minHeight, result.coordinates.height) / result.visibleArea.height,
				Math.max(sizeRestrictions.minWidth, result.coordinates.width) / result.visibleArea.width,
			),
		);
	}

	// Scale visible area to prevent overlap area restrictions
	result.visibleArea = resizeToSizeRestrictions(result.visibleArea, getAreaSizeRestrictions(result, settings));

	// Move visible are to prevent moving of the coordinates:
	const move = inverseMove(fitToPositionRestrictions(result.coordinates, toLimits(result.visibleArea)));
	if (result.visibleArea.width < result.coordinates.width) {
		move.left = 0;
	}
	if (result.visibleArea.height < result.coordinates.height) {
		move.top = 0;
	}
	result.visibleArea = applyMove(result.visibleArea, move);

	// Move visible area to prevent overlap the area restrictions
	result.visibleArea = moveToPositionRestrictions(result.visibleArea, getAreaPositionRestrictions(result, settings));

	result = fitCoordinates(result, settings);

	return result;
}
