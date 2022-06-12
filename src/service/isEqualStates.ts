import { CropperState } from '../types';
import { deepCompare } from '../utils';

export function isEqualStates(a: CropperState | null, b: CropperState | null): boolean {
	return deepCompare(a, b);
}
