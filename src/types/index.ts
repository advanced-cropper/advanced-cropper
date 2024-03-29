export type TimingFunction = string;

export interface Coordinates {
	width: number;
	height: number;
	top: number;
	left: number;
}

export type VisibleArea = Coordinates;

export interface Limits {
	top?: number;
	left?: number;
	right?: number;
	bottom?: number;
}

export interface SizeRestrictions {
	minWidth: number;
	maxWidth: number;
	minHeight: number;
	maxHeight: number;
}
export type AreaSizeRestrictions = SizeRestrictions;

export type PositionRestrictions = Limits;

export type AreaPositionRestrictions = Limits;

export interface ResizeDirections {
	top: number;
	left: number;
	right: number;
	bottom: number;
}

export interface MoveDirections {
	top: number;
	left: number;
}

export interface Point {
	top: number;
	left: number;
}

export interface Size {
	width: number;
	height: number;
}
export type ImageSize = Size;

export type Boundary = Size;

export interface Intersections {
	left: number;
	top: number;
	bottom: number;
	right: number;
}

export interface AspectRatio {
	minimum: number;
	maximum: number;
}

export type ResizeAnchor = OrdinalDirection | 'center';

export type RawAspectRatio = Partial<AspectRatio> | number;

export interface Diff {
	left: number;
	top: number;
}

export interface Position {
	left: number;
	top: number;
}

export enum ImageRestriction {
	fillArea = 'fillArea',
	fitArea = 'fitArea',
	stencil = 'stencil',
	none = 'none',
}

export enum Priority {
	coordinates = 'coordinates',
	visibleArea = 'visibleArea',
}

export type PositionDirection = 'left' | 'top' | 'right' | 'bottom';
export type HorizontalDirection = 'left' | 'right';
export type VerticalDirection = 'top' | 'bottom';
export type MainDirections = 'left' | 'top';

export type HorizontalCardinalDirection = 'west' | 'east';
export type VerticalCardinalDirection = 'north' | 'south';
export type CardinalDirection = HorizontalCardinalDirection | VerticalCardinalDirection;
export type OrdinalDirection =
	| HorizontalCardinalDirection
	| VerticalCardinalDirection
	| 'westNorth'
	| 'westSouth'
	| 'eastNorth'
	| 'eastSouth';

export interface Scale {
	factor: number;
	center?: Point;
}

export interface Rotate {
	angle: number;
	center?: Point;
}

export interface Flip {
	horizontal?: boolean;
	vertical?: boolean;
}

export interface Transforms {
	rotate: number;
	flip: {
		horizontal: boolean;
		vertical: boolean;
	};
}

export interface PartialTransforms {
	rotate?: number;
	flip?: {
		horizontal?: boolean;
		vertical?: boolean;
	};
}

export interface ImageTransform {
	scale?: number | Scale;
	move?: {
		left?: number;
		top?: number;
	};
	rotate?: number | Rotate;
	flip?: Flip;
}

export type CoordinatesTransform =
	| ((state: CropperState, settings: CoreSettings) => Partial<Coordinates> | null)
	| Partial<Coordinates>
	| null;

export interface CropperState {
	boundary: Boundary;
	imageSize: ImageSize;
	transforms: Transforms;
	visibleArea: VisibleArea | null;
	coordinates: Coordinates | null;
}

export interface InitializedCropperState {
	boundary: Boundary;
	imageSize: ImageSize;
	transforms: Transforms;
	visibleArea: VisibleArea;
	coordinates: Coordinates;
}

export type BoundarySizeAlgorithm = (boundary: HTMLElement, size: Size) => Boundary;

export type DefaultSize<Settings = CoreSettings> =
	| Size
	| BivarianceConstraint<(state: CropperState, props: Settings) => Size>;

export type DefaultPosition<Settings = CoreSettings> =
	| Position
	| BivarianceConstraint<(state: CropperState, props: Settings) => Position>;

export type DefaultVisibleArea<Settings = CoreSettings> =
	| VisibleArea
	| BivarianceConstraint<(state: CropperState, props: Settings) => VisibleArea>;

export type DefaultCoordinates<Settings = CoreSettings> =
	| (CoordinatesTransform | CoordinatesTransform[])
	| BivarianceConstraint<(state: CropperState, settings: Settings) => CoordinatesTransform | CoordinatesTransform[]>;

export type DefaultTransforms<Settings = CoreSettings> =
	| PartialTransforms
	| BivarianceConstraint<(state: CropperState, settings: Settings) => PartialTransforms>;

export interface CoreSettings {
	areaPositionRestrictions:
		| AreaPositionRestrictions
		| BivarianceConstraint<(state: CropperState, settings: this) => AreaPositionRestrictions>;
	areaSizeRestrictions:
		| AreaSizeRestrictions
		| BivarianceConstraint<(state: CropperState, settings: this) => AreaSizeRestrictions>;
	sizeRestrictions:
		| SizeRestrictions
		| BivarianceConstraint<(state: CropperState, settings: this) => SizeRestrictions>;
	positionRestrictions:
		| PositionRestrictions
		| BivarianceConstraint<(state: CropperState, settings: this) => PositionRestrictions>;
	aspectRatio: AspectRatio | BivarianceConstraint<(state: CropperState, settings: this) => RawAspectRatio>;
}

export interface InitializeSettings {
	defaultCoordinates: DefaultCoordinates<this>;
	defaultVisibleArea: DefaultVisibleArea<this>;
	defaultTransforms?: DefaultTransforms<this>;
	priority?: Priority;
}

// The hacky way to enable bivariance instead of contravariance,
// that is default when strictFunctionTypes is on
// https://www.typescriptlang.org/tsconfig#strictFunctionTypes
export type BivarianceConstraint<T extends (...args: any) => any> = {
	method(...args: Parameters<T>): ReturnType<T>;
}['method'];

export interface ModifierSettings {
	transformImage?: {
		adjustStencil?: boolean;
	};
	moveCoordinates?: {};
	resizeCoordinates?: {};
}

export interface CropperImage {
	src: string;
	revoke: boolean;
	transforms: Transforms;
	arrayBuffer: ArrayBuffer | null;
	width: number;
	height: number;
}

export interface CropperTransitions {
	timingFunction: TimingFunction;
	duration: number;
	active: boolean;
}

export type CropperInteractions = {
	moveCoordinates: boolean;
	resizeCoordinates: boolean;
	transformImage: {
		rotate: boolean;
		move: boolean;
		scale: boolean;
		flip: boolean;
	};
};

export interface CropperTransitionsSettings {
	timingFunction?: string;
	duration?: number;
}

export interface SimpleTouch {
	clientX: number;
	clientY: number;
}

export interface PostprocessAction<Name extends string = string> {
	name?: Name;
	immediately?: boolean;
	transitions?: boolean;
	interaction?: boolean;
}

export type PostprocessFunction<Settings = CoreSettings, State = CropperState> = BivarianceConstraint<
	(state: State, settings: Settings, action: PostprocessAction) => State
>;

export type Nullable<T> = T | null | undefined;

export type DebouncedFunction<T extends (...args: any[]) => any> = T & { clear: () => void };
