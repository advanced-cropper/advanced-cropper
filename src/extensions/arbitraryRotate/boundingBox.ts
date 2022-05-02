import { CropperState, Scale, Size } from '../../types';
import { isInitializedState, rotateSize } from '../../service';
import { isFunction } from '../../utils';
import { ArbitraryRotateSettings } from './index';

export enum BoundingBox {
	Circle = 'circle',
	Rectangle = 'rectangle',
}

export type BoundingBoxFunction = (state: CropperState, settings: ArbitraryRotateSettings) => Size | null;

export function circleBoundingBox(state: CropperState, settings: ArbitraryRotateSettings) {
	if (isInitializedState(state)) {
		return {
			width: state.coordinates.width,
			height: state.coordinates.height,
		};
	}
	return null;
}

export function rectangleBoundingBox(state: CropperState, settings: ArbitraryRotateSettings) {
	if (isInitializedState(state)) {
		const size = {
			width: state.coordinates.width,
			height: state.coordinates.height,
		};
		return rotateSize(size, state.transforms.rotate);
	}
	return null;
}

export function toBoundingBox(state: CropperState, settings: ArbitraryRotateSettings) {
	if (isFunction(settings.boundingBox)) {
		return settings.boundingBox(state, settings);
	} else if (settings.boundingBox === BoundingBox.Circle) {
		return circleBoundingBox(state, settings);
	} else {
		return rectangleBoundingBox(state, settings);
	}
}

export function fromBoundingBox(state: CropperState, settings: ArbitraryRotateSettings, boundingBox: Size) {}

export const rectangle = {
	to(size: Size, angle: number) {
		return rotateSize(size, angle);
	},
	from(size: Size, angle: number) {
		const radians = (angle * Math.PI) / 180;

		return {
			width:
				(Math.abs(size.width * Math.cos(radians)) - Math.abs(size.height * Math.sin(radians))) /
				(Math.pow(Math.cos(radians), 2) - Math.pow(Math.sin(radians), 2)),
			height:
				(Math.abs(size.height * Math.cos(radians)) - Math.abs(size.width * Math.sin(radians))) /
				(Math.pow(Math.cos(radians), 2) - Math.pow(Math.sin(radians), 2)),
		};
	},
};
