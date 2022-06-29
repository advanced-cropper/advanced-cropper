import { Coordinates, CoreSettings, CropperState, CoordinatesTransform, Point, Size } from '../types';
import {
	getAspectRatio,
	getPositionRestrictions,
	getSizeRestrictions,
	mergePositionRestrictions,
	coordinatesToPositionRestrictions,
	approximateSize,
	getAreaSizeRestrictions,
	applyScale,
	maxScale,
	applyMove,
	inverseMove,
	fitToPositionRestrictions,
	fitVisibleArea,
} from '../service';
import { moveCoordinatesAlgorithm } from '../algorithms';
import { emptyCoordinates, isUndefined } from '../utils';
import { copyState } from './copyState';

export enum SetCoordinatesMode {
	limit = 'limit',
	zoom = 'zoom',
	unsafe = 'unsafe',
}

export type SetCoordinatesAlgorithm<Settings extends CoreSettings = CoreSettings> = (
	state: CropperState,
	settings: Settings,
	transforms: CoordinatesTransform | CoordinatesTransform[],
	safe?: boolean | SetCoordinatesMode,
) => CropperState;

export function setCoordinates(
	state: CropperState,
	settings: CoreSettings,
	transform: CoordinatesTransform | CoordinatesTransform[],
	// If you set mode to `false`, the coordinates can leave the visible area
	mode: boolean | SetCoordinatesMode = true,
) {
	const currentMode = mode === false ? SetCoordinatesMode.unsafe : mode === true ? SetCoordinatesMode.zoom : mode;

	const aspectRatio = getAspectRatio(state, settings);

	let sizeRestrictions = getSizeRestrictions(state, settings);
	if (state.visibleArea && currentMode === SetCoordinatesMode.limit) {
		sizeRestrictions = {
			...sizeRestrictions,
			minWidth: Math.min(state.visibleArea.width, sizeRestrictions.minWidth),
			minHeight: Math.min(state.visibleArea.height, sizeRestrictions.minHeight),
			maxWidth: Math.min(state.visibleArea.width, sizeRestrictions.maxWidth),
			maxHeight: Math.min(state.visibleArea.height, sizeRestrictions.maxHeight),
		};
	}

	let positionRestrictions = getPositionRestrictions(state, settings);
	if (state.visibleArea && currentMode === SetCoordinatesMode.limit) {
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
		let changes: Partial<Coordinates> | null;
		if (typeof transform === 'function') {
			changes = transform({ ...state, coordinates }, settings);
		} else {
			changes = transform;
		}
		if (changes) {
			if (!isUndefined(changes.width) || !isUndefined(changes.height)) {
				coordinates = resize(coordinates, { ...coordinates, ...changes });
			}
			if (!isUndefined(changes.left) || !isUndefined(changes.top)) {
				coordinates = move(coordinates, { ...coordinates, ...changes });
			}
		}
	});

	const result = {
		...copyState(state),
		coordinates,
	};

	if (result.visibleArea && currentMode === SetCoordinatesMode.zoom) {
		const widthIntersections = Math.max(0, result.coordinates.width - result.visibleArea.width);
		const heightIntersections = Math.max(0, result.coordinates.height - result.visibleArea.height);

		const areaSizeRestrictions = getAreaSizeRestrictions(state, settings);

		const scale =
			widthIntersections > heightIntersections
				? result.coordinates.width / result.visibleArea.width
				: result.coordinates.height / result.visibleArea.height;

		if (scale > 1) {
			result.visibleArea = applyScale(
				result.visibleArea,
				Math.min(scale, maxScale(result.visibleArea, areaSizeRestrictions)),
			);
		}

		result.visibleArea = applyMove(
			result.visibleArea,
			inverseMove(
				fitToPositionRestrictions(result.coordinates, coordinatesToPositionRestrictions(result.visibleArea)),
			),
		);

		return fitVisibleArea(result, settings);
	} else {
		return result;
	}
}
