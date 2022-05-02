import { CoreSettings, CropperState, VisibleArea } from '../types';
import { copyState } from './copyState';
import { fitCoordinates, fitVisibleArea } from '../service';

export type SetVisibleAreaAlgorithm<Settings extends CoreSettings = CoreSettings> = (
	state: CropperState,
	settings: Settings,
	visibleArea: VisibleArea,
) => CropperState;

export function setVisibleArea(
	state: CropperState,
	settings: CoreSettings,
	visibleArea: VisibleArea,
	// If you set safe to `false`, the coordinates can leave the visible area
	safe = true,
) {
	let result: CropperState = { ...copyState(state), visibleArea };

	// There is no possibility to break visible area limitations.
	result = fitVisibleArea(result, settings);

	if (safe) {
		result = fitCoordinates(result, settings);
	}

	return result;
}
