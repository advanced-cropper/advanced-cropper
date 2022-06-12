import { fitToImage } from '../../../src/extensions/fitToImage/position';
import { BoundingBoxType } from '../../../src/extensions/fitToImage/boundingBox';

describe('fitPositionToImage', () => {
	it('should correctly fit coordinates ot image', () => {
		const image = {
			width: 9,
			height: 15,
			angle: 26.3,
		};
		const coordinates = {
			left: 4,
			top: 4,
			width: 3,
			height: 4,
		};
		const result = fitToImage(coordinates, image, BoundingBoxType.Rectangle);
	});
});
