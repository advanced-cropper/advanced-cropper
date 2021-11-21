import { distance, isRoughlyEqual, sign } from './utils';
import { Point, SimpleTouch } from './types';

interface GeometricProperties {
	centerMass: Point;
	spread: number;
	count: number;
}

function calculateGeometricProperties(touches: SimpleTouch[], container: HTMLElement): GeometricProperties {
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

export function touchesToImageTransform(
	touches: SimpleTouch[],
	previousTouches: SimpleTouch[],
	container: HTMLElement,
	options: { rotate?: boolean; move?: boolean; scale?: boolean } = {},
) {
	let move, scale, rotate;

	if (previousTouches.length === 1 && touches.length === 1) {
		if (options.move) {
			move = {
				left: previousTouches[0].clientX - touches[0].clientX,
				top: previousTouches[0].clientY - touches[0].clientY,
			};
		}
	} else if (touches.length > 1) {
		const previousProperties = calculateGeometricProperties(previousTouches, container);
		const properties = calculateGeometricProperties(touches, container);

		if (options.rotate && previousTouches.length === 2 && touches.length === 2) {
			const diffs = {
				left: [
					touches[0].clientX - touches[1].clientX,
					previousTouches[0].clientX - previousTouches[1].clientX,
				],
				top: [touches[0].clientY - touches[1].clientY, previousTouches[0].clientY - previousTouches[1].clientY],
			};

			const y = diffs.left[0] * diffs.top[1] - diffs.left[1] * diffs.top[0];
			const x = diffs.left[0] * diffs.left[1] + diffs.top[0] * diffs.top[1];

			if (!isRoughlyEqual(x, 0) && !isRoughlyEqual(y, 0)) {
				const radians = Math.atan2(y, x);
				const angle = -(radians * 180) / Math.PI;
				rotate = {
					center: properties.centerMass,
					angle,
				};
			}
		}

		if (options.move) {
			move = {
				left: previousProperties.centerMass.left - properties.centerMass.left,
				top: previousProperties.centerMass.top - properties.centerMass.top,
			};
		}

		if (options.scale) {
			scale = {
				factor: properties.spread / previousProperties.spread,
				center: properties.centerMass,
			};
		}
	}

	return {
		move,
		scale,
		rotate,
	};
}

export function wheelEventToImageTransform(
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
	return { scale: { factor, center } };
}
