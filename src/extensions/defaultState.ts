import { Boundary, CoreSettings, CropperImage, CropperState, Priority } from '../types';
import { createState, CreateStateAlgorithm } from '../state';

interface GetDefaultStateOptions {
	algorithm?: CreateStateAlgorithm;
	priority?: Priority;
}

export function getDefaultState(
	settings: CoreSettings,
	boundary: Boundary,
	image: CropperImage,
	currentState: CropperState | null = null,
	options: GetDefaultStateOptions = {},
) {
	const { algorithm = createState, priority } = options;

	const transforms = currentState?.transforms || {
		rotate: 0,
	};

	const k = (transforms.rotate > 0 ? Math.floor : Math.ceil)(transforms.rotate / 360);

	return algorithm(
		{
			boundary,
			imageSize: {
				width: image.width,
				height: image.height,
			},
			priority: priority,
			transforms: {
				...image.transforms,
				rotate: k * 360 + image.transforms.rotate,
			},
		},
		settings,
	);
}
