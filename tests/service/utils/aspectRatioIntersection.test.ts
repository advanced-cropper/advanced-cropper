import { aspectRatioIntersection } from '../../../src/service';

describe('aspectRatioIntersection(args)', () => {
	it('should find the correct intersection', () => {
		expect(
			aspectRatioIntersection(
				{
					minimum: 1,
					maximum: 4,
				},
				{
					minimum: 2,
					maximum: 3,
				},
			),
		).toEqual({
			minimum: 2,
			maximum: 3,
		});

		expect(
			aspectRatioIntersection(
				{
					minimum: 1,
					maximum: 4,
				},
				{
					minimum: 0,
					maximum: Infinity,
				},
			),
		).toEqual({
			minimum: 1,
			maximum: 4,
		});
	});

	it('should not break main aspect ratio in any case', () => {
		expect(
			aspectRatioIntersection(
				{
					minimum: 1,
					maximum: 2,
				},
				{
					minimum: 3,
					maximum: 4,
				},
			),
		).toEqual({
			minimum: 2,
			maximum: 2,
		});

		expect(
			aspectRatioIntersection(
				{
					minimum: 3,
					maximum: 4,
				},
				{
					minimum: 1,
					maximum: 2,
				},
			),
		).toEqual({
			minimum: 3,
			maximum: 3,
		});
	});
});
