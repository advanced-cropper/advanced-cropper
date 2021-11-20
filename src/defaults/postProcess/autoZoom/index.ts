import { hybridStencilAutoZoom } from './hybridStencilAutoZoom';
import { simplestAutoZoom } from './simplestAutoZoom';
import { fixedStencilAutoZoom } from './fixedStencilAutoZoom';
import { CropperSettings, CropperState, PostprocessAction, PostprocessFunction } from '../../../types';
import { StencilSize } from '../../';

interface AutoZoomCropperSettings extends CropperSettings {
	autoZoom: boolean;
	stencilSize: StencilSize;
}

export function autoZoom(state: CropperState, settings: AutoZoomCropperSettings, action?: PostprocessAction) {
	let algorithm: PostprocessFunction;
	if (settings.stencilSize) {
		algorithm = fixedStencilAutoZoom;
	} else if (settings.autoZoom) {
		algorithm = hybridStencilAutoZoom;
	} else {
		algorithm = simplestAutoZoom;
	}

	return algorithm(state, settings, action);
}
