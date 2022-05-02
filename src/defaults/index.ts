import { defaultPositionRestrictions } from './defaultPositionRestrictions';
import { defaultVisibleArea } from './defaultVisibleArea';
import { defaultSize } from './defaultSize';
import { pixelsRestrictions } from './defaultSizeRestrictions';
import { mergePositionRestrictions, mergeSizeRestrictions } from '../service';
import {
	AreaPositionRestrictions,
	AreaSizeRestrictions,
	AspectRatio,
	CropperSettings,
	CropperState,
	DefaultCoordinates,
	DefaultPosition,
	DefaultSize,
	DefaultVisibleArea,
	ImageRestriction,
	PositionRestrictions,
	SizeRestrictions,
} from '../types';
import { defaultPosition } from './defaultPosition';
import { defaultAreaPositionRestrictions } from './defaultAreaPositionRestrictions';
import { defaultAreaSizeRestrictions } from './defaultAreaSizeRestrictions';
import { isFunction } from '../utils';

export type ScaleImageOptions = {
	enabled?: boolean;
	adjustStencil?: boolean;
};

export interface WithDefaultsSettings<Settings extends DefaultSettings> {
	minWidth?: number;
	minHeight?: number;
	maxWidth?: number;
	maxHeight?: number;
	defaultSize?: DefaultSize<Settings>;
	defaultPosition?: DefaultPosition<Settings>;
	defaultCoordinates?: DefaultCoordinates<Settings>;
	defaultVisibleArea?: DefaultVisibleArea<Settings>;
	imageRestriction?: ImageRestriction;
	aspectRatio?: AspectRatio | ((state: CropperState, setting: Settings) => AspectRatio);
	areaSizeRestrictions?: AreaSizeRestrictions | ((state: CropperState, settings: Settings) => AreaSizeRestrictions);
	areaPositionRestrictions?:
		| AreaPositionRestrictions
		| ((state: CropperState, settings: Settings) => AreaPositionRestrictions);
	sizeRestrictions?: SizeRestrictions | ((state: CropperState, settings: Settings) => SizeRestrictions);
	positionRestrictions?: PositionRestrictions | ((state: CropperState, settings: Settings) => PositionRestrictions);
}

export interface DefaultSettings extends CropperSettings {
	minWidth?: number;
	minHeight?: number;
	maxWidth?: number;
	maxHeight?: number;
	defaultSize?: DefaultSize<DefaultSettings>;
	defaultPosition?: DefaultPosition<DefaultSettings>;
	imageRestriction?: ImageRestriction;
}

export type DefaultSettingsExtension<Settings> = Omit<Settings, keyof DefaultSettings>;

export function withDefaultSizeRestrictions<Settings extends CropperSettings>(
	sizeRestrictions: SizeRestrictions | ((state: CropperState, settings: Settings) => SizeRestrictions),
) {
	return (state: CropperState, basicSettings: DefaultSettings & Settings) => {
		const value = isFunction(sizeRestrictions) ? sizeRestrictions(state, basicSettings) : sizeRestrictions;
		return mergeSizeRestrictions(pixelsRestrictions(state, basicSettings), value);
	};
}

export function withDefaultPositionRestrictions<Settings extends CropperSettings>(
	positionRestrictions: PositionRestrictions | ((state: CropperState, settings: Settings) => PositionRestrictions),
) {
	return (state: CropperState, basicSettings: DefaultSettings & Settings) => {
		const value = isFunction(positionRestrictions)
			? positionRestrictions(state, basicSettings)
			: positionRestrictions;
		return mergePositionRestrictions(defaultPositionRestrictions(state, basicSettings), value);
	};
}

export function withDefaultAreaPositionRestrictions<Settings extends CropperSettings>(
	areaPositionRestrictions:
		| AreaPositionRestrictions
		| ((state: CropperState, settings: Settings) => AreaPositionRestrictions),
) {
	return (state: CropperState, basicSettings: DefaultSettings & Settings) => {
		const value = isFunction(areaPositionRestrictions)
			? areaPositionRestrictions(state, basicSettings)
			: areaPositionRestrictions;

		return mergePositionRestrictions(defaultAreaPositionRestrictions(state, basicSettings), value);
	};
}

export function withDefaultAreaSizeRestrictions<Settings extends CropperSettings>(
	areaSizeRestrictions:
		| AreaSizeRestrictions
		| ((state: CropperState, settings: CropperSettings) => AreaSizeRestrictions),
) {
	return (state: CropperState, basicSettings: DefaultSettings & Settings) => {
		const value = isFunction(areaSizeRestrictions)
			? areaSizeRestrictions(state, basicSettings)
			: areaSizeRestrictions;

		return mergeSizeRestrictions(defaultAreaSizeRestrictions(state, basicSettings), value);
	};
}

export function withDefaults<Settings extends DefaultSettings>(settings: WithDefaultsSettings<Settings>) {
	return {
		...settings,
		sizeRestrictions: (state: CropperState, basicSettings: Settings) => {
			let restrictions;
			if (settings.sizeRestrictions) {
				restrictions = isFunction(settings.sizeRestrictions)
					? settings.sizeRestrictions(state, basicSettings)
					: settings.sizeRestrictions;
			} else {
				restrictions = pixelsRestrictions(state, basicSettings);
			}
			return restrictions;
		},
		areaPositionRestrictions: (state: CropperState, basicSettings: Settings) => {
			if (settings.areaPositionRestrictions) {
				return isFunction(settings.areaPositionRestrictions)
					? settings.areaPositionRestrictions(state, basicSettings)
					: settings.areaPositionRestrictions;
			} else {
				return defaultAreaPositionRestrictions(state, basicSettings);
			}
		},
		areaSizeRestrictions: (state: CropperState, basicSettings: Settings) => {
			if (settings.areaSizeRestrictions) {
				return isFunction(settings.areaSizeRestrictions)
					? settings.areaSizeRestrictions(state, basicSettings)
					: settings.areaSizeRestrictions;
			} else {
				return defaultAreaSizeRestrictions(state, basicSettings);
			}
		},
		positionRestrictions: (state: CropperState, basicSettings: Settings) => {
			if (settings.positionRestrictions) {
				return isFunction(settings.positionRestrictions)
					? settings.positionRestrictions(state, basicSettings)
					: settings.positionRestrictions;
			} else {
				return defaultPositionRestrictions(state, basicSettings);
			}
		},
		defaultCoordinates: (state: CropperState, basicSettings: Settings) => {
			if (settings.defaultCoordinates) {
				return isFunction(settings.defaultCoordinates)
					? settings.defaultCoordinates(state, basicSettings)
					: settings.defaultCoordinates;
			} else {
				let defaultSizeAlgorithm = settings.defaultSize;
				if (!defaultSizeAlgorithm) {
					defaultSizeAlgorithm = defaultSize;
				}

				const size = isFunction(defaultSizeAlgorithm)
					? defaultSizeAlgorithm(state, basicSettings)
					: defaultSizeAlgorithm;

				const defaultPositionAlgorithm = settings.defaultPosition || defaultPosition;

				return [
					size,
					(state: CropperState) => ({
						...(isFunction(defaultPositionAlgorithm)
							? defaultPositionAlgorithm(state, basicSettings)
							: defaultPositionAlgorithm),
					}),
				];
			}
		},
		defaultVisibleArea: (state: CropperState, basicSettings: Settings) => {
			if (settings.defaultVisibleArea) {
				return isFunction(settings.defaultVisibleArea)
					? settings.defaultVisibleArea(state, basicSettings)
					: settings.defaultVisibleArea;
			} else {
				return defaultVisibleArea(state, basicSettings);
			}
		},
		aspectRatio: (state: CropperState, basicSettings: Settings) => {
			let minimum = 0;
			let maximum = Infinity;
			if (settings.aspectRatio) {
				const value = isFunction(settings.aspectRatio)
					? settings.aspectRatio(state, basicSettings)
					: settings.aspectRatio;
				if (value.minimum) {
					minimum = value.minimum;
				}
				if (value.maximum) {
					maximum = value.maximum;
				}
			}
			return {
				minimum,
				maximum,
			};
		},
	} as DefaultSettings;
}

export function defaultSettings() {
	return withDefaults({});
}

export * from './defaultAreaPositionRestrictions';
export * from './defaultPosition';
export * from './defaultSize';
export * from './defaultAreaSizeRestrictions';
export * from './defaultVisibleArea';
export * from './defaultBoundary';
export * from './defaultPositionRestrictions';
export * from './defaultSizeRestrictions';
