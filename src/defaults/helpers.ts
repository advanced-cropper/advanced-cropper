import { CropperSettings, CropperState } from '../types';
import { ratio, approximateSize } from '../service';
import { isFunction } from '../utils';
import { StencilSize } from './';

export function getFixedStencilSize(state: CropperState, settings: CropperSettings & { stencilSize: StencilSize }) {
	const { boundary } = state;

	let size = isFunction(settings.stencilSize) ? settings.stencilSize(state, settings) : settings.stencilSize;

	if (size.width > boundary.width || size.height > boundary.height) {
		size = approximateSize({
			sizeRestrictions: {
				maxWidth: boundary.width,
				maxHeight: boundary.height,
				minWidth: 0,
				minHeight: 0,
			},
			width: size.width,
			height: size.height,
			aspectRatio: {
				minimum: ratio(size),
				maximum: ratio(size),
			},
		});
	}

	return size;
}
