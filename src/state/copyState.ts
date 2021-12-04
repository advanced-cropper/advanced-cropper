import { CropperState } from '../types';

export function copyState<T extends CropperState | null>(state: T): T {
	return state
		? {
				...state,
				coordinates: state.coordinates && { ...state.coordinates },
				imageSize: state.imageSize && { ...state.imageSize },
				boundary: state.boundary && { ...state.boundary },
				visibleArea: state.visibleArea && { ...state.visibleArea },
				transforms: {
					...state.transforms,
					flip: {
						...state.transforms.flip,
					},
				},
		  }
		: null;
}
