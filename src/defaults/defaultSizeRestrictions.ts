import { CropperState, SizeRestrictions } from '../types';
import { isNumeric, parseNumber } from '../utils';

interface ExtendedCropperSettings {
	minWidth?: number;
	maxWidth?: number;
	minHeight?: number;
	maxHeight?: number;
}

export function retrieveSizeRestrictions(settings: ExtendedCropperSettings) {
	return {
		minWidth: isNumeric(settings.minWidth) ? parseNumber(settings.minWidth) : 0,
		minHeight: isNumeric(settings.minHeight) ? parseNumber(settings.minHeight) : 0,
		maxWidth: isNumeric(settings.maxWidth) ? parseNumber(settings.maxWidth) : Infinity,
		maxHeight: isNumeric(settings.maxHeight) ? parseNumber(settings.maxHeight) : Infinity,
	};
}

export function pixelsRestrictions(state: CropperState, settings: ExtendedCropperSettings): SizeRestrictions {
	return retrieveSizeRestrictions(settings);
}
