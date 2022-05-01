import { hybridStencilAutoZoom } from './hybridStencilAutoZoom';
import { simplestAutoZoom } from './simplestAutoZoom';
import { CropperSettings, CropperState, PostprocessAction } from '../../../types';
import { ScaleImageOptions } from '../../';
import { staticAutoZoom } from './staticAutoZoom';

interface AutoZoomCropperSettings extends CropperSettings {
	autoZoom?: boolean;
	scaleImage?: ScaleImageOptions;
}

export function autoZoom(state: CropperState, settings: AutoZoomCropperSettings, action: PostprocessAction = {}) {
	if (settings.autoZoom) {
		return hybridStencilAutoZoom(state, settings, action);
	} else {
		return settings.scaleImage?.enabled
			? simplestAutoZoom(state, settings, action)
			: staticAutoZoom(state, settings, action);
	}
}
