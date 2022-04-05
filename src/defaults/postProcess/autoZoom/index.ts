import { hybridStencilAutoZoom } from './hybridStencilAutoZoom';
import { simplestAutoZoom } from './simplestAutoZoom';
import { fixedStencilAutoZoom } from './fixedStencilAutoZoom';
import { CropperSettings, CropperState, PostprocessAction } from '../../../types';
import { StencilSize } from '../../';

interface AutoZoomCropperSettings extends CropperSettings {
	autoZoom?: boolean;
	stencilSize?: StencilSize;
}

export function autoZoom(state: CropperState, settings: AutoZoomCropperSettings, action: PostprocessAction = {}) {
	if (settings.stencilSize) {
		return fixedStencilAutoZoom(state, { ...settings, stencilSize: settings.stencilSize }, action);
	} else if (settings.autoZoom) {
		return hybridStencilAutoZoom(state, settings, action);
	} else {
		return simplestAutoZoom(state, settings, action);
	}
}
