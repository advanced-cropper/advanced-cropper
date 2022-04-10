import { hybridStencilAutoZoom } from './hybridStencilAutoZoom';
import { simplestAutoZoom } from './simplestAutoZoom';
import { fixedStencilAutoZoom } from './fixedStencilAutoZoom';
import { CropperSettings, CropperState, PostprocessAction } from '../../../types';
import { StencilSize } from '../../';
import { staticAutoZoom } from './staticAutoZoom';

interface AutoZoomCropperSettings extends CropperSettings {
	autoZoom?: boolean;
	stencilSize?: StencilSize;
	scaleImage?: boolean;
}

export function autoZoom(state: CropperState, settings: AutoZoomCropperSettings, action: PostprocessAction = {}) {
	if (settings.stencilSize) {
		return fixedStencilAutoZoom(state, { ...settings, stencilSize: settings.stencilSize }, action);
	} else if (settings.autoZoom) {
		return hybridStencilAutoZoom(state, settings, action);
	} else {
		return settings.scaleImage === false
			? staticAutoZoom(state, settings, action)
			: simplestAutoZoom(state, settings, action);
	}
}
