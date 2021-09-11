import { CropperSettings, CropperState, ResizeDirections } from '../types';
import { copyState } from './copyState';
import {
	getAspectRatio,
	getMinimumSize,
	getPositionRestrictions,
	getSizeRestrictions,
	resizeCoordinatesAlgorithm,
	ResizeOptions,
	mergePositionRestrictions,
	coordinatesToPositionRestrictions,
} from '../service';

export type ResizeAlgorithm = (
	state: CropperState,
	settings: CropperSettings,
	directions: ResizeDirections,
	options: ResizeOptions,
) => CropperState;

export function resizeCoordinates(
	state: CropperState,
	settings: CropperSettings,
	directions: ResizeDirections,
	options: ResizeOptions,
) {
	const minimumSize = getMinimumSize(state);

	const sizeRestrictions = getSizeRestrictions(state, settings);

	return {
		...copyState(state),
		coordinates: resizeCoordinatesAlgorithm(state.coordinates, directions, options, {
			positionRestrictions: mergePositionRestrictions(
				getPositionRestrictions(state, settings),
				coordinatesToPositionRestrictions(state.visibleArea),
			),
			sizeRestrictions: {
				maxWidth: Math.min(sizeRestrictions.maxWidth, state.visibleArea.width),
				maxHeight: Math.min(sizeRestrictions.maxHeight, state.visibleArea.height),
				minWidth: Math.max(Math.min(sizeRestrictions.minWidth, state.visibleArea.width), minimumSize),
				minHeight: Math.max(Math.min(sizeRestrictions.minHeight, state.visibleArea.height), minimumSize),
			},
			aspectRatio: getAspectRatio(state, settings),
		}),
	};
}
