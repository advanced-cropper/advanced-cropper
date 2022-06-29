import { defaultPositionRestrictions } from './defaultPositionRestrictions';
import { defaultVisibleArea } from './defaultVisibleArea';
import { defaultSize } from './defaultSize';
import { pixelsRestrictions } from './defaultSizeRestrictions';
import { createAspectRatio, mergePositionRestrictions, mergeSizeRestrictions } from '../service';
import {
	AreaPositionRestrictions,
	AreaSizeRestrictions,
	CoreSettings,
	CropperState,
	DefaultCoordinates,
	DefaultPosition,
	DefaultSize,
	DefaultVisibleArea,
	ImageRestriction,
	PositionRestrictions,
	RawAspectRatio,
	SizeRestrictions,
} from '../types';
import { defaultPosition } from './defaultPosition';
import { defaultAreaPositionRestrictions } from './defaultAreaPositionRestrictions';
import { defaultAreaSizeRestrictions } from './defaultAreaSizeRestrictions';
import { isFunction } from '../utils';

export interface DefaultSettingsParams<Settings extends CoreSettings & DefaultSettings> {
	minWidth?: number;
	minHeight?: number;
	maxWidth?: number;
	maxHeight?: number;
	defaultSize?: DefaultSize<Settings>;
	defaultPosition?: DefaultPosition<Settings>;
	imageRestriction?: ImageRestriction;
	defaultCoordinates?: DefaultCoordinates<Settings>;
	defaultVisibleArea?: DefaultVisibleArea<Settings>;
	aspectRatio?: RawAspectRatio | ((state: CropperState, setting: Settings) => RawAspectRatio);
	areaSizeRestrictions?: AreaSizeRestrictions | ((state: CropperState, settings: Settings) => AreaSizeRestrictions);
	areaPositionRestrictions?:
		| AreaPositionRestrictions
		| ((state: CropperState, settings: Settings) => AreaPositionRestrictions);
	sizeRestrictions?: SizeRestrictions | ((state: CropperState, settings: Settings) => SizeRestrictions);
	positionRestrictions?: PositionRestrictions | ((state: CropperState, settings: Settings) => PositionRestrictions);
}

export interface DefaultSettings {
	minWidth?: number;
	minHeight?: number;
	maxWidth?: number;
	maxHeight?: number;
	defaultSize?: DefaultSize<this>;
	defaultPosition?: DefaultPosition<this>;
	imageRestriction?: ImageRestriction;
}

export function withDefaultSizeRestrictions<Settings extends CoreSettings & DefaultSettings>(
	sizeRestrictions: SizeRestrictions | ((state: CropperState, settings: Settings) => SizeRestrictions),
) {
	return (state: CropperState, basicSettings: Settings) => {
		const value = isFunction(sizeRestrictions) ? sizeRestrictions(state, basicSettings) : sizeRestrictions;
		return mergeSizeRestrictions(pixelsRestrictions(state, basicSettings), value);
	};
}

export function withDefaultPositionRestrictions(
	positionRestrictions:
		| PositionRestrictions
		| ((state: CropperState, settings: CoreSettings) => PositionRestrictions),
) {
	return (state: CropperState, basicSettings: CoreSettings & DefaultSettings) => {
		const value = isFunction(positionRestrictions)
			? positionRestrictions(state, basicSettings)
			: positionRestrictions;
		return mergePositionRestrictions(defaultPositionRestrictions(state, basicSettings), value);
	};
}

export function withDefaultAreaPositionRestrictions(
	areaPositionRestrictions:
		| AreaPositionRestrictions
		| ((state: CropperState, settings: CoreSettings) => AreaPositionRestrictions),
) {
	return (state: CropperState, basicSettings: CoreSettings & DefaultSettings) => {
		const value = isFunction(areaPositionRestrictions)
			? areaPositionRestrictions(state, basicSettings)
			: areaPositionRestrictions;

		return mergePositionRestrictions(defaultAreaPositionRestrictions(state, basicSettings), value);
	};
}

export function withDefaultAreaSizeRestrictions(
	areaSizeRestrictions:
		| AreaSizeRestrictions
		| ((state: CropperState, settings: CoreSettings) => AreaSizeRestrictions),
) {
	return (state: CropperState, basicSettings: CoreSettings & DefaultSettings) => {
		const value = isFunction(areaSizeRestrictions)
			? areaSizeRestrictions(state, basicSettings)
			: areaSizeRestrictions;

		return mergeSizeRestrictions(defaultAreaSizeRestrictions(state, basicSettings), value);
	};
}

export function createDefaultSettings<Settings extends CoreSettings & DefaultSettings>(
	params: DefaultSettingsParams<Settings>,
) {
	return {
		...params,
		sizeRestrictions: (state: CropperState, basicSettings: Settings) => {
			let restrictions;
			if (params.sizeRestrictions) {
				restrictions = isFunction(params.sizeRestrictions)
					? params.sizeRestrictions(state, basicSettings)
					: params.sizeRestrictions;
			} else {
				restrictions = pixelsRestrictions(state, basicSettings);
			}
			return restrictions;
		},
		areaPositionRestrictions: (state: CropperState, basicSettings: Settings) => {
			if (params.areaPositionRestrictions) {
				return isFunction(params.areaPositionRestrictions)
					? params.areaPositionRestrictions(state, basicSettings)
					: params.areaPositionRestrictions;
			} else {
				return defaultAreaPositionRestrictions(state, basicSettings);
			}
		},
		areaSizeRestrictions: (state: CropperState, basicSettings: Settings) => {
			if (params.areaSizeRestrictions) {
				return isFunction(params.areaSizeRestrictions)
					? params.areaSizeRestrictions(state, basicSettings)
					: params.areaSizeRestrictions;
			} else {
				return defaultAreaSizeRestrictions(state, basicSettings);
			}
		},
		positionRestrictions: (state: CropperState, basicSettings: Settings) => {
			if (params.positionRestrictions) {
				return isFunction(params.positionRestrictions)
					? params.positionRestrictions(state, basicSettings)
					: params.positionRestrictions;
			} else {
				return defaultPositionRestrictions(state, basicSettings);
			}
		},
		defaultCoordinates: (state: CropperState, basicSettings: Settings) => {
			if (params.defaultCoordinates) {
				return isFunction(params.defaultCoordinates)
					? params.defaultCoordinates(state, basicSettings)
					: params.defaultCoordinates;
			} else {
				let defaultSizeAlgorithm = params.defaultSize;
				if (!defaultSizeAlgorithm) {
					defaultSizeAlgorithm = defaultSize;
				}

				const size = isFunction(defaultSizeAlgorithm)
					? defaultSizeAlgorithm(state, basicSettings)
					: defaultSizeAlgorithm;

				const defaultPositionAlgorithm = params.defaultPosition || defaultPosition;

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
			if (params.defaultVisibleArea) {
				return isFunction(params.defaultVisibleArea)
					? params.defaultVisibleArea(state, basicSettings)
					: params.defaultVisibleArea;
			} else {
				return defaultVisibleArea(state, basicSettings);
			}
		},
		aspectRatio: (state: CropperState, basicSettings: Settings) => {
			return createAspectRatio(
				isFunction(params.aspectRatio) ? params.aspectRatio(state, basicSettings) : params.aspectRatio,
			);
		},
	};
}

export * from './defaultAreaPositionRestrictions';
export * from './defaultPosition';
export * from './defaultSize';
export * from './defaultAreaSizeRestrictions';
export * from './defaultVisibleArea';
export * from './defaultBoundary';
export * from './defaultPositionRestrictions';
export * from './defaultSizeRestrictions';
export * from './defaultStencilConstraints';
