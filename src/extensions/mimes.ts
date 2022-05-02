const imageMimes = [
	{
		format: 'image/png',
		pattern: [0x89, 0x50, 0x4e, 0x47],
	},
	{
		format: 'image/jpeg',
		pattern: [0xff, 0xd8, 0xff],
	},
	{
		format: 'image/gif',
		pattern: [0x47, 0x49, 0x46, 0x38],
	},
	{
		format: 'image/webp',
		pattern: [
			0x52,
			0x49,
			0x46,
			0x46,
			undefined,
			undefined,
			undefined,
			undefined,
			0x57,
			0x45,
			0x42,
			0x50,
			0x56,
			0x50,
		],
	},
];

export function getMimeType(arrayBuffer: ArrayBuffer, fallback = null) {
	const byteArray = new Uint8Array(arrayBuffer).subarray(0, 4);

	const candidate = imageMimes.find((el) => el.pattern.every((p, i) => !p || byteArray[i] === p));

	return candidate ? candidate.format : fallback;
}
