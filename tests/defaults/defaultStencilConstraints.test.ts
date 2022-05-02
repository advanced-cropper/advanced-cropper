import { defaultStencilConstraints } from '../../src/defaults';

describe('defaultStencilConstraints', () => {
	it('should correctly define aspectRatio', () => {
		expect(defaultStencilConstraints({}, { aspectRatio: { minimum: 1 } })).toEqual({
			aspectRatio: {
				minimum: 1,
				maximum: Infinity,
			},
		});
	});
});
