import { Boundary, CoreSettings, CropperState, ImageSize, PartialTransforms, Priority } from '../types';
import { setCoordinates, SetCoordinatesMode } from './setCoordinates';
import { getDefaultCoordinates, getDefaultVisibleArea } from '../service';
import { setVisibleArea } from './setVisibleArea';

export interface CreateStateOptions {
	boundary: Boundary;
	imageSize: ImageSize;
	transforms?: PartialTransforms;
	priority?: Priority;
}

export type CreateStateAlgorithm<Settings extends CoreSettings = CoreSettings> = (
	options: CreateStateOptions,
	settings: Settings,
) => CropperState;

export function createState(options: CreateStateOptions, settings: CoreSettings): CropperState {
	const { boundary, imageSize, transforms, priority } = options;
	let state: CropperState = {
		boundary: {
			width: boundary.width,
			height: boundary.height,
		},
		imageSize: {
			width: imageSize.width,
			height: imageSize.height,
		},
		transforms: {
			rotate: transforms?.rotate || 0,
			flip: {
				horizontal: transforms?.flip?.horizontal || false,
				vertical: transforms?.flip?.vertical || false,
			},
		},
		visibleArea: null,
		coordinates: null,
	};

	if (priority === Priority.visibleArea) {
		state = setVisibleArea(state, settings, getDefaultVisibleArea(state, settings), false);
		state = setCoordinates(state, settings, getDefaultCoordinates(state, settings), SetCoordinatesMode.limit);
	} else {
		state = setCoordinates(state, settings, getDefaultCoordinates(state, settings), SetCoordinatesMode.unsafe);
		state = setVisibleArea(state, settings, getDefaultVisibleArea(state, settings), true);
	}

	return state;
}
