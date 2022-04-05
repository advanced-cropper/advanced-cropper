import { Coordinates, CropperSettings, CropperState, CoordinatesTransform, Point, Size } from '../types';
import {
	getAspectRatio,
	getPositionRestrictions,
	getSizeRestrictions,
	mergePositionRestrictions,
	coordinatesToPositionRestrictions,
	approximateSize,
} from '../service';
import { moveCoordinatesAlgorithm } from '../algorithms';
import { emptyCoordinates, isUndefined } from '../utils';
import { copyState } from './copyState';

export type SetCoordinatesAlgorithm = (
	state: CropperState,
	settings: CropperSettings,
	transforms: CoordinatesTransform | CoordinatesTransform[],
	safe?: boolean,
) => CropperState;

export function setCoordinates(
	state: CropperState,
	settings: CropperSettings,
	transform: CoordinatesTransform | CoordinatesTransform[],
	// If you set safe to `false`, the coordinates can leave the visible area
	safe = true,
) {
	const aspectRatio = getAspectRatio(state, settings);

	let sizeRestrictions = getSizeRestrictions(state, settings);
	if (state.visibleArea && safe) {
		sizeRestrictions = {
			...sizeRestrictions,
			minWidth: Math.min(state.visibleArea.width, sizeRestrictions.minWidth),
			minHeight: Math.min(state.visibleArea.height, sizeRestrictions.minHeight),
			maxWidth: Math.min(state.visibleArea.width, sizeRestrictions.maxWidth),
			maxHeight: Math.min(state.visibleArea.height, sizeRestrictions.maxHeight),
		};
	}

	let positionRestrictions = getPositionRestrictions(state, settings);
	if (state.visibleArea && safe) {
		positionRestrictions = mergePositionRestrictions(
			positionRestrictions,
			coordinatesToPositionRestrictions(state.visibleArea),
		);
	}

	const move = (prevCoordinates: Coordinates, newCoordinates: Point) => {
		return moveCoordinatesAlgorithm(
			prevCoordinates,
			{
				left: newCoordinates.left - (prevCoordinates.left || 0),
				top: newCoordinates.top - (prevCoordinates.top || 0),
			},
			positionRestrictions,
		);
	};

	const resize = (prevCoordinates: Coordinates, newCoordinates: Size) => {
		const coordinates = {
			...prevCoordinates,
			...approximateSize({
				width: newCoordinates.width,
				height: newCoordinates.height,
				sizeRestrictions,
				aspectRatio,
			}),
			left: 0,
			top: 0,
		};

		return move(coordinates, {
			left: prevCoordinates.left || 0,
			top: prevCoordinates.top || 0,
		});
	};

	let coordinates = state.coordinates ? { ...state.coordinates } : emptyCoordinates();

	const transforms = Array.isArray(transform) ? transform : [transform];

	transforms.forEach((transform) => {
		let changes: Partial<Coordinates>;
		if (typeof transform === 'function') {
			changes = transform({ ...state, coordinates }, settings);
		} else {
			changes = transform;
		}

		if (!isUndefined(changes.width) || !isUndefined(changes.height)) {
			coordinates = resize(coordinates, { ...coordinates, ...changes });
		}
		if (!isUndefined(changes.left) || !isUndefined(changes.top)) {
			coordinates = move(coordinates, { ...coordinates, ...changes });
		}
	});

	return {
		...copyState(state),
		coordinates,
	};
}
