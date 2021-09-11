import { CropperSettings, CropperState } from '../types';
import { fitVisibleArea } from '../service/fitVisibleArea';
import { fitCoordinates } from '../service/fitCoordinates';

export type ReconcileStateAlgorithm = (state: CropperState, settings: CropperSettings) => CropperState;

export function reconcileState(state: CropperState, settings: CropperSettings) {
	return fitCoordinates(fitVisibleArea(state, settings), settings);
}
