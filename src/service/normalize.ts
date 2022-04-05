import { CropperState, ImageTransform, MoveDirections, Point, ResizeDirections } from '../types';
import { getCoefficient } from './helpers';
import { isNumber } from '../utils';

export function normalizeResizeDirections(
	state: CropperState,
	directions: Partial<ResizeDirections>,
): ResizeDirections {
	const coefficient = getCoefficient(state);

	return {
		left: isNumber(directions.left) ? directions.left * coefficient : 0,
		top: isNumber(directions.top) ? directions.top * coefficient : 0,
		right: isNumber(directions.right) ? directions.right * coefficient : 0,
		bottom: isNumber(directions.bottom) ? directions.bottom * coefficient : 0,
	};
}

export function normalizeCenter(state: CropperState, center: Point) {
	const coefficient = getCoefficient(state);

	if (state.visibleArea) {
		return {
			left: center.left * coefficient + state.visibleArea.left,
			top: center.top * coefficient + state.visibleArea.top,
		};
	} else {
		return center;
	}
}

export function fillMoveDirections(directions: Partial<MoveDirections>): MoveDirections {
	return {
		left: isNumber(directions.left) ? directions.left : 0,
		top: isNumber(directions.top) ? directions.top : 0,
	};
}
export function fillResizeDirections(directions: Partial<ResizeDirections>): ResizeDirections {
	return {
		left: isNumber(directions.left) ? directions.left : 0,
		top: isNumber(directions.top) ? directions.top : 0,
		right: isNumber(directions.right) ? directions.right : 0,
		bottom: isNumber(directions.bottom) ? directions.bottom : 0,
	};
}

export function normalizeMoveDirections(state: CropperState, directions: Partial<MoveDirections>): MoveDirections {
	const coefficient = getCoefficient(state);

	return {
		left: isNumber(directions.left) ? directions.left * coefficient : 0,
		top: isNumber(directions.top) ? directions.top * coefficient : 0,
	};
}

export function normalizeImageTransform(state: CropperState, transform: ImageTransform) {
	if (transform.scale) {
		transform.scale = {
			factor: isNumber(transform.scale) ? transform.scale : transform.scale.factor,
			center:
				!isNumber(transform.scale) && transform.scale.center
					? normalizeCenter(state, transform.scale.center)
					: undefined,
		};
	}
	if (transform.rotate) {
		transform.rotate = {
			angle: isNumber(transform.rotate) ? transform.rotate : transform.rotate.angle,
			center:
				!isNumber(transform.rotate) && transform.rotate.center
					? normalizeCenter(state, transform.rotate.center)
					: undefined,
		};
	}
	if (transform.move) {
		transform.move = normalizeMoveDirections(state, transform.move);
	}

	return transform;
}
