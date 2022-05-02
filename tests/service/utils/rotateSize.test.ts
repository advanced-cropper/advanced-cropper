import { rotateSize } from '../../../src/service';

describe('rotateSize', () => {
	it('should rotate size correctly', () => {
		const a = rotateSize(
			{
				width: 6,
				height: 9,
			},
			40.6,
		);
		expect(a.width).toBeCloseTo(10.41);
		expect(a.height).toBeCloseTo(10.74);
	});
});
