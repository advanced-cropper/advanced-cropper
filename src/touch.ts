import { distance, sign } from './utils';
import { Point } from './types';
import { TransformImageEvent } from './events';

export interface SimpleTouch {
	clientX: number;
	clientY: number;
}

export interface GeometricProperties {
	centerMass: Point;
	spread: number;
	count: number;
}

export function getMeanTouch(touches: SimpleTouch[]): SimpleTouch {
	return touches.reduce(
		(mean, touch) => {
			return {
				clientX: mean.clientX + touch.clientX / touches.length,
				clientY: mean.clientY + touch.clientY / touches.length,
			};
		},
		{ clientX: 0, clientY: 0 },
	);
}

export function calculateGeometricProperties(touches: SimpleTouch[], container: HTMLElement): GeometricProperties {
	const { left, top } = container.getBoundingClientRect();

	const centerMass = { left: 0, top: 0 };
	let spread = 0;

	touches.forEach((touch) => {
		centerMass.left += (touch.clientX - left) / touches.length;
		centerMass.top += (touch.clientY - top) / touches.length;
	});

	touches.forEach((touch) => {
		spread += distance(
			{ x: centerMass.left, y: centerMass.top },
			{ x: touch.clientX - left, y: touch.clientY - top },
		);
	});

	return { centerMass, spread, count: touches.length };
}

export function createTouchResizeEvent(oldProperties: GeometricProperties, newProperties: GeometricProperties) {
	return new TransformImageEvent(
		{
			left: oldProperties.centerMass.left - newProperties.centerMass.left,
			top: oldProperties.centerMass.top - newProperties.centerMass.top,
		},
		{
			factor: newProperties.spread / oldProperties.spread,
			center: newProperties.centerMass,
		},
	);
}

export function createTouchMoveEvent(oldTouches: SimpleTouch[], newTouches: SimpleTouch[]) {
	return new TransformImageEvent({
		left: oldTouches[0].clientX - newTouches[0].clientX,
		top: oldTouches[0].clientY - newTouches[0].clientY,
	});
}

export function createWheelResizeEvent(
	event: WheelEvent & { wheelDelta?: number },
	container: HTMLElement,
	ratio = 0.1,
) {
	const { left, top } = container.getBoundingClientRect();
	const factor = 1 - ratio * sign(event.deltaY || event.detail || event.wheelDelta);
	const center = {
		left: event.clientX - left,
		top: event.clientY - top,
	};
	return new TransformImageEvent({}, { factor, center });
}
