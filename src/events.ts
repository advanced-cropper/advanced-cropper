import { Diff, MoveDirections, Point, ResizeDirections, Scale } from './types';

export class TransformImageEvent {
	nativeEvent: Event;
	move: Partial<MoveDirections>;
	scale: Scale | number;
	constructor(move: Partial<MoveDirections> = {}, scale: Scale | number = 1) {
		this.move = move;
		this.scale = scale;
	}
}

export class ResizeEvent<Options = Record<string, unknown>> {
	directions: ResizeDirections;
	options: Options;

	constructor(directions: ResizeDirections, options: Options) {
		this.directions = directions;
		this.options = options;
	}
}

export class MoveEvent {
	directions: MoveDirections;

	constructor(directions: MoveDirections) {
		this.directions = directions;
	}
}

export class DragEvent {
	nativeEvent: TouchEvent | MouseEvent;
	position: Point;
	previousPosition: Point;
	anchor: Point;
	element: HTMLElement;

	constructor(
		nativeEvent: TouchEvent | MouseEvent,
		element: HTMLElement,
		position: Point,
		previousPosition: Point,
		anchor: Point,
	) {
		this.nativeEvent = nativeEvent;
		this.position = position;
		this.previousPosition = previousPosition;
		this.element = element;
		this.anchor = anchor;
	}
	public shift(): Diff {
		const { element, anchor, position } = this;
		const { left, top } = element.getBoundingClientRect();

		return {
			left: position.left - left - anchor.left,
			top: position.top - top - anchor.top,
		};
	}
}
