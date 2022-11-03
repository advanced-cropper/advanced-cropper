import { Boundary, CoreSettings, CropperState, InitializeSettings, Priority, Size, Transforms } from '../types';
import { setCoordinates, SetCoordinatesMode } from './setCoordinates';
import { getDefaultCoordinates, getDefaultTransforms, getDefaultVisibleArea } from '../service';
import { setVisibleArea } from './setVisibleArea';

export interface CreateStateOptions {
	boundary: Boundary;
	image: Size & { transforms?: Transforms };
}

export type CreateStateAlgorithm<
	Settings extends CoreSettings & InitializeSettings = CoreSettings & InitializeSettings
> = (options: CreateStateOptions, settings: Settings) => CropperState;

export function createState(options: CreateStateOptions, settings: CoreSettings & InitializeSettings): CropperState {
	const { boundary, image } = options;
	let state: CropperState = {
		boundary: {
			width: boundary.width,
			height: boundary.height,
		},
		imageSize: {
			width: image.width,
			height: image.height,
		},
		transforms: {
			rotate: image.transforms?.rotate || 0,
			flip: {
				horizontal: image.transforms?.flip?.horizontal || false,
				vertical: image.transforms?.flip?.vertical || false,
			},
		},
		visibleArea: null,
		coordinates: null,
	};

	if (settings.defaultTransforms) {
		state.transforms = getDefaultTransforms(state, settings);
	}

	if (settings.priority === Priority.visibleArea) {
		state = setVisibleArea(state, settings, getDefaultVisibleArea(state, settings), false);
		state = setCoordinates(state, settings, getDefaultCoordinates(state, settings), SetCoordinatesMode.limit);
	} else {
		state = setCoordinates(state, settings, getDefaultCoordinates(state, settings), SetCoordinatesMode.unsafe);
		state = setVisibleArea(state, settings, getDefaultVisibleArea(state, settings), true);
	}

	return state;
}
