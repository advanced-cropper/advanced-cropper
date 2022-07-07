import { CropperState } from '../types';
import { deepCompare } from '../utils';

export function isEqualState(a: CropperState | null, b: CropperState | null): boolean {
	return deepCompare(a, b);
}
