import { defaultPositionRestrictions } from './defaultPositionRestrictions';
import { defaultVisibleArea } from './defaultVisibleArea';
import { defaultSize, fixedDefaultSize } from './defaultSize';
import { getFixedStencilSize } from './helpers';
import { pixelsRestrictions } from './defaultSizeRestrictions';
import { getAreaSizeRestrictions, mergeSizeRestrictions } from '../service';
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
	Size,
} from '../types';
import { defaultPosition } from './defaultPosition';
import { defaultAreaPositionRestrictions } from './defaultAreaPositionRestrictions';
import { defaultAreaSizeRestrictions } from './defaultAreaSizeRestrictions';
import { isFunction } from '../utils';
import { ratio } from '../service';
import { autoZoom } from './postProcess/autoZoom';

export type StencilSize<Settings = CropperSettings> = Size | ((state: CropperState, props: Settings) => Size);

export interface ExtendedCropperSettings {
	minWidth?: number;
	minHeight?: number;
	maxWidth?: number;
	maxHeight?: number;
	defaultSize?: DefaultSize<DefaultSettings>;
	defaultPosition?: DefaultPosition<DefaultSettings>;
	defaultCoordinates?: DefaultCoordinates<DefaultSettings>;
	defaultVisibleArea?: DefaultVisibleArea<DefaultSettings>;
	stencilSize?: StencilSize<DefaultSettings>;
	imageRestriction?: ImageRestriction;
	adjustStencil?: boolean;
	scaleImage?: boolean;
	aspectRatio?: AspectRatio | ((state: CropperState, setting: CropperSettings) => AspectRatio);
	areaSizeRestrictions?:
		| AreaSizeRestrictions
		| ((state: CropperState, settings: DefaultSettings) => AreaSizeRestrictions);
	areaPositionRestrictions?:
		| AreaPositionRestrictions
		| ((state: CropperState, settings: DefaultSettings) => AreaPositionRestrictions);
	sizeRestrictions?: SizeRestrictions | ((state: CropperState, settings: DefaultSettings) => SizeRestrictions);
	positionRestrictions?:
		| PositionRestrictions
		| ((state: CropperState, settings: DefaultSettings) => PositionRestrictions);
}

type DefaultSettings = CropperSettings & {
	minWidth?: number;
	minHeight?: number;
	maxWidth?: number;
	maxHeight?: number;
	defaultSize?: DefaultSize<DefaultSettings>;
	defaultPosition?: DefaultPosition<DefaultSettings>;
	defaultVisibleArea?: DefaultVisibleArea<DefaultSettings>;
	stencilSize?: StencilSize<DefaultSettings>;
	imageRestriction?: ImageRestriction;
};

export function withDefaults(settings: ExtendedCropperSettings) {
	return {
		...settings,
		sizeRestrictions: (state: CropperState, basicSettings: DefaultSettings) => {
			let restrictions;
			if (settings.sizeRestrictions) {
				restrictions = isFunction(settings.sizeRestrictions)
					? settings.sizeRestrictions(state, basicSettings)
					: settings.sizeRestrictions;
			} else {
				restrictions = pixelsRestrictions(state, basicSettings);
			}

			if (basicSettings.stencilSize && state.visibleArea) {
				const stencilSize = getFixedStencilSize(state, {
					...basicSettings,
					stencilSize: basicSettings.stencilSize,
				});

				const areaRestrictions = getAreaSizeRestrictions(state, basicSettings);

				restrictions = mergeSizeRestrictions(restrictions, {
					maxWidth: (areaRestrictions.maxWidth * stencilSize.width) / state.boundary.width,
					maxHeight: (areaRestrictions.maxHeight * stencilSize.height) / state.boundary.height,
				});
			}

			return restrictions;
		},
		areaPositionRestrictions: (state: CropperState, basicSettings: DefaultSettings) => {
			if (settings.areaPositionRestrictions) {
				return isFunction(settings.areaPositionRestrictions)
					? settings.areaPositionRestrictions(state, basicSettings)
					: settings.areaPositionRestrictions;
			} else {
				return defaultAreaPositionRestrictions(state, basicSettings);
			}
		},
		areaSizeRestrictions: (state: CropperState, basicSettings: DefaultSettings) => {
			if (settings.areaSizeRestrictions) {
				return isFunction(settings.areaSizeRestrictions)
					? settings.areaSizeRestrictions(state, basicSettings)
					: settings.areaSizeRestrictions;
			} else {
				return defaultAreaSizeRestrictions(state, basicSettings);
			}
		},
		positionRestrictions: (state: CropperState, basicSettings: DefaultSettings) => {
			if (settings.positionRestrictions) {
				return isFunction(settings.positionRestrictions)
					? settings.positionRestrictions(state, basicSettings)
					: settings.positionRestrictions;
			} else {
				return defaultPositionRestrictions(state, basicSettings);
			}
		},
		defaultCoordinates: (state: CropperState, basicSettings: DefaultSettings) => {
			if (settings.defaultCoordinates) {
				return isFunction(settings.defaultCoordinates)
					? settings.defaultCoordinates(state, basicSettings)
					: settings.defaultCoordinates;
			} else {
				let defaultSizeAlgorithm = settings.defaultSize;
				if (!defaultSizeAlgorithm) {
					if (settings.stencilSize) {
						defaultSizeAlgorithm = fixedDefaultSize as DefaultSize;
					} else {
						defaultSizeAlgorithm = defaultSize as DefaultSize;
					}
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
		defaultVisibleArea: (state: CropperState, basicSettings: DefaultSettings) => {
			if (settings.defaultVisibleArea) {
				return isFunction(settings.defaultVisibleArea)
					? settings.defaultVisibleArea(state, basicSettings)
					: settings.defaultVisibleArea;
			} else {
				return defaultVisibleArea(state, basicSettings);
			}
		},
		aspectRatio: (state: CropperState, basicSettings: DefaultSettings) => {
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
			if (settings.stencilSize) {
				const stencilSize = getFixedStencilSize(state, { ...basicSettings, stencilSize: settings.stencilSize });
				minimum = maximum = ratio(stencilSize);
			}
			return {
				minimum,
				maximum,
			};
		},
		adjustStencil: !settings.stencilSize && settings.adjustStencil,
	};
}

export function defaultSettings() {
	return withDefaults({});
}

export const defaultPostprocess = autoZoom;

export * from './helpers';
export * from './defaultAreaPositionRestrictions';
export * from './defaultPosition';
export * from './defaultSize';
export * from './defaultAreaSizeRestrictions';
export * from './defaultVisibleArea';
export * from './defaultBoundary';
export * from './defaultPositionRestrictions';
export * from './defaultSizeRestrictions';
export * from './postProcess/autoZoom/index';
