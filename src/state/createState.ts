import { Boundary, CropperSettings, CropperState, ImageSize, Transforms } from '../types';
import { setCoordinates } from './setCoordinates';
import { getDefaultCoordinates, getDefaultVisibleArea } from '../service/helpers';
import { setVisibleArea } from './setVisibleArea';

export interface CreateStateOptions {
	boundary: Boundary;
	imageSize: ImageSize;
	transforms?: Transforms;
	priority?: 'visibleArea' | 'coordinates';
}

export type CreateStateAlgorithm = (options: CreateStateOptions, settings: CropperSettings) => CropperState;

export function createState(options: CreateStateOptions, settings: CropperSettings): CropperState {
	const { boundary, imageSize, transforms, priority } = options;
	let state = {
		boundary: {
			width: boundary.width,
			height: boundary.height,
		},
		imageSize: {
			width: imageSize.width,
			height: imageSize.height,
		},
		transforms: {
			flip: {
				...(transforms && transforms.flip),
				horizontal: false,
				vertical: false,
			},
			rotate: (transforms && transforms.rotate) || 0,
		},
		visibleArea: null,
		coordinates: null,
	};

	if (priority !== 'visibleArea') {
		state = setCoordinates(state, settings, getDefaultCoordinates(state, settings), false);
		state = setVisibleArea(state, settings, getDefaultVisibleArea(state, settings), true);
	} else {
		state = setVisibleArea(state, settings, getDefaultVisibleArea(state, settings), false);
		state = setCoordinates(state, settings, getDefaultCoordinates(state, settings), true);
	}

	return state;
}
