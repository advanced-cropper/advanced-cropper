import { CropperSettings, CropperState, VisibleArea } from '../types';
import { copyState } from './copyState';
import { fitVisibleArea } from '../service/fitVisibleArea';
import { fitCoordinates } from '../service/fitCoordinates';

export type SetVisibleAreaAlgorithm = (
	state: CropperState,
	settings: CropperSettings,
	visibleArea: VisibleArea,
) => CropperState;

export function setVisibleArea(
	state: CropperState,
	settings: CropperSettings,
	visibleArea: VisibleArea,
	// If you set safe to `false`, the coordinates can leave the visible area
	safe = true,
) {
	let result = { ...copyState(state), visibleArea };

	// There is no possibility to break visible area limitations.
	result = fitVisibleArea(result, settings);

	if (safe) {
		result = fitCoordinates(result, settings);
	}

	return result;
}
