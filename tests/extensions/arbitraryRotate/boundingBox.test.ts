import { rectangle } from '../../../src/extensions/arbitraryRotate/boundingBox';

describe('rectange', () => {
	it('should correctly define aspectRatio', () => {
		const box = {
			width: 150,
			height: 50,
		};
		const angle = 180;

		for (let i = 0; i < 100; i++) {
			const box = {
				width: Math.random() * 1000,
				height: Math.random() * 1000,
			};
			const angle = Math.random() * 360;

			const to = rectangle.to(box, angle);
			const from = rectangle.from(to, angle);
			expect(box.width).toBeCloseTo(from.width);
			expect(box.height).toBeCloseTo(from.height);
		}
	});
});
