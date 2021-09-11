import { TransformImageEvent, MoveEvent, ResizeEvent } from '../events';
import { CropperState } from '../types';
import { getCoefficient } from './helpers';
import { isNumber, mapObject } from '../utils';

export function normalizeTransformImageEvent(state: CropperState, event: TransformImageEvent) {
	const coefficient = getCoefficient(state);
	return new TransformImageEvent(
		mapObject(event.move, (value) => value * coefficient),
		{
			factor: isNumber(event.scale) ? event.scale : event.scale.factor,
			center:
				!isNumber(event.scale) && event.scale.center
					? {
							left: event.scale.center.left * coefficient + state.visibleArea.left,
							top: event.scale.center.top * coefficient + state.visibleArea.top,
					  }
					: undefined,
		},
	);
}

export function normalizeMoveEvent(state: CropperState, event: MoveEvent) {
	const coefficient = getCoefficient(state);

	return new MoveEvent(mapObject(event.directions, (value) => value * coefficient));
}

export function normalizeResizeEvent(state: CropperState, event: ResizeEvent) {
	const coefficient = getCoefficient(state);

	return new ResizeEvent(
		mapObject(event.directions, (value) => value * coefficient),
		event.options,
	);
}
