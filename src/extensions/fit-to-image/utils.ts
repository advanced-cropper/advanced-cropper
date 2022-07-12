import { CropperState } from '../../types';

export function getRotatedImage(state: CropperState) {
	return {
		width: state.imageSize.width,
		height: state.imageSize.height,
		angle: state.transforms.rotate,
	};
}
