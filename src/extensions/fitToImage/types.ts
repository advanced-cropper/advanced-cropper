export interface RotatedImage {
	width: number;
	height: number;
	angle: number;
}

export type BoundingBox = BoundingBoxType;

export enum BoundingBoxType {
	Circle = 'circle',
	Rectangle = 'rectangle',
}

export interface FitToImageSettings {
	stencilBoundingBox?: BoundingBox;
}
