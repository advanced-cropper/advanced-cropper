import { CropperEvent, Diff, MoveDirections, Point, ResizeDirections } from './interfaces';

interface ManipulateImageEventScale {
	factor: number;
	center: Point;
}
interface ManipulateImageEventParams {
	compensate: boolean;
}
export class ManipulateImageEvent implements CropperEvent {
	type: 'manipulateImage';
	nativeEvent: Event;
	move: Partial<MoveDirections>;
	scale: Partial<ManipulateImageEventScale>;
	params: {
		compensate?: boolean;
	};
	constructor(
		nativeEvent: Event,
		move: Partial<MoveDirections> = {},
		scale: Partial<ManipulateImageEventScale> = {},
		params: Partial<ManipulateImageEventParams> = {},
	) {
		this.type = 'manipulateImage';
		this.nativeEvent = nativeEvent;
		this.move = move;
		this.scale = scale;
		this.params = params;
	}
}

export interface ResizeEventParams {
	compensate?: boolean;
	preserveRatio?: boolean;
	allowedDirections?: ResizeDirections;
	respectDirection?: 'width' | 'height';
}

export class ResizeEvent implements CropperEvent {
	type: 'resize';
	nativeEvent: Event;
	directions: ResizeDirections;
	params: ResizeEventParams;

	constructor(nativeEvent: Event, directions: ResizeDirections, params: ResizeEventParams = {}) {
		this.type = 'resize';
		this.nativeEvent = nativeEvent;
		this.directions = directions;
		this.params = params;
	}
}

export class MoveEvent implements CropperEvent {
	type: 'move';
	nativeEvent: Event | null | undefined;
	directions: MoveDirections;

	constructor(nativeEvent: Event | null | undefined, directions: MoveDirections) {
		this.type = 'move';
		this.nativeEvent = nativeEvent;
		this.directions = directions;
	}
}

export class DragEvent implements CropperEvent {
	type: 'drag';
	nativeEvent: Event;
	position: Point;
	previousPosition: Point;
	anchor: Point;
	element: HTMLElement;

	constructor(nativeEvent: Event, element: HTMLElement, position: Point, previousPosition: Point, anchor: Point) {
		this.type = 'drag';
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
