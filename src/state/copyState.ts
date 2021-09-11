import { CropperState } from '../types';

export function copyState(state: CropperState): CropperState {
	return {
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
	};
}
