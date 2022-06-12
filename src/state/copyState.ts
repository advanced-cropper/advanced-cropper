import { CropperState } from '../types';
import { deepClone } from '../utils';

export function copyState<T extends CropperState | null>(state: T): T {
	return deepClone(state);
}
