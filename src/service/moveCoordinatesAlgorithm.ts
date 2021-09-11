import { Coordinates, MoveDirections, PositionRestrictions } from '../types';
import { applyMove, moveToPositionRestrictions } from './utils';

export function moveCoordinatesAlgorithm(
	coordinates: Coordinates,
	directions: MoveDirections,
	positionRestrictions: PositionRestrictions,
): Coordinates {
	const movedCoordinates = applyMove(coordinates, directions);

	return positionRestrictions ? moveToPositionRestrictions(movedCoordinates, positionRestrictions) : movedCoordinates;
}
