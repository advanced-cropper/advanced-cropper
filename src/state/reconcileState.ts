import { CropperSettings, CropperState } from '../types';
import { fitCoordinates, fitVisibleArea } from '../service';

export type ReconcileStateAlgorithm = (state: CropperState, settings: CropperSettings) => CropperState;

export function reconcileState(state: CropperState, settings: CropperSettings) {
	return fitCoordinates(fitVisibleArea(state, settings), settings);
}
