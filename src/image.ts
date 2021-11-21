import { CropperImage, CropperState, CropperTransitions, Size, Transforms } from './types';
import { rotateSize, getCoefficient, getComputedTransforms, getTransformedImageSize } from './service';
import { isBlob, isLocal } from './utils';

const XHR_DONE = 4;

function base64ToArrayBuffer(base64) {
	base64 = base64.replace(/^data:([^;]+);base64,/gim, '');
	const binary = atob(base64);
	const len = binary.length;
	const buffer = new ArrayBuffer(len);
	const view = new Uint8Array(buffer);
	for (let i = 0; i < len; i++) {
		view[i] = binary.charCodeAt(i);
	}
	return buffer;
}

function objectURLToBlob(url, callback) {
	const http = new XMLHttpRequest();
	http.open('GET', url, true);
	http.responseType = 'blob';
	http.onload = function () {
		if (this.status == 200 || this.status === 0) {
			callback(this.response);
		}
	};
	http.send();
}

function getTransforms(orientation: number) {
	const result: Transforms = {
		flip: {
			horizontal: false,
			vertical: false,
		},
		rotate: 0,
	};
	if (orientation) {
		switch (orientation) {
			case 2:
				result.flip.horizontal = true;
				break;
			case 3:
				result.rotate = -180;
				break;
			case 4:
				result.flip.vertical = true;
				break;
			case 5:
				result.rotate = 90;
				result.flip.vertical = true;
				break;
			case 6:
				result.rotate = 90;
				break;
			case 7:
				result.rotate = 90;
				result.flip.horizontal = true;
				break;
			case 8:
				result.rotate = -90;
				break;
		}
	}
	return result;
}

function getImageData(img) {
	return new Promise((resolve, reject) => {
		try {
			if (img) {
				if (/^data:/i.test(img)) {
					// Data URL
					resolve(base64ToArrayBuffer(img));
				} else if (/^blob:/i.test(img)) {
					// Blob
					const fileReader = new FileReader();
					fileReader.onload = function (e) {
						resolve(e.target.result);
					};
					objectURLToBlob(img, function (blob) {
						fileReader.readAsArrayBuffer(blob);
					});
				} else {
					// Simple URL
					let http = new XMLHttpRequest();
					http.onreadystatechange = function () {
						if (http.readyState !== XHR_DONE) return;

						if (http.status === 200 || http.status === 0) {
							resolve(http.response);
						} else {
							reject('Warning: could not load an image to parse its orientation');
						}
						http = null;
					};
					http.onprogress = function () {
						// Abort the request directly if it not a JPEG image for better performance
						if (http.getResponseHeader('content-type') !== 'image/jpeg') {
							http.abort();
						}
					};
					http.withCredentials = false;
					http.open('GET', img, true);
					http.responseType = 'arraybuffer';
					http.send(null);
				}
			} else {
				reject('Error: the image is empty');
			}
		} catch (e) {
			reject(e);
		}
	});
}

export function getStyleTransforms({ rotate, flip, scaleX, scaleY }) {
	let transform = '';
	transform += ` rotate(${rotate}deg) `;
	transform += ` scaleX(${scaleX * (flip.horizontal ? -1 : 1)}) `;
	transform += ` scaleY(${scaleY * (flip.vertical ? -1 : 1)}) `;
	return transform;
}

function getStringFromCharCode(dataView, start, length) {
	let str = '';
	let i;
	for (i = start, length += start; i < length; i++) {
		str += String.fromCharCode(dataView.getUint8(i));
	}
	return str;
}

function resetAndGetOrientation(arrayBuffer) {
	try {
		const dataView = new DataView(arrayBuffer);
		let orientation;
		let exifIDCode;
		let tiffOffset;
		let littleEndian;
		let app1Start;
		let ifdStart;
		// Only handle JPEG image (start by 0xFFD8)
		if (dataView.getUint8(0) === 0xff && dataView.getUint8(1) === 0xd8) {
			const length = dataView.byteLength;
			let offset = 2;
			while (offset + 1 < length) {
				if (dataView.getUint8(offset) === 0xff && dataView.getUint8(offset + 1) === 0xe1) {
					app1Start = offset;
					break;
				}
				offset++;
			}
		}
		if (app1Start) {
			exifIDCode = app1Start + 4;
			tiffOffset = app1Start + 10;
			if (getStringFromCharCode(dataView, exifIDCode, 4) === 'Exif') {
				const endianness = dataView.getUint16(tiffOffset);

				littleEndian = endianness === 0x4949;

				if (littleEndian || endianness === 0x4d4d /* bigEndian */) {
					if (dataView.getUint16(tiffOffset + 2, littleEndian) === 0x002a) {
						const firstIFDOffset = dataView.getUint32(tiffOffset + 4, littleEndian);
						if (firstIFDOffset >= 0x00000008) {
							ifdStart = tiffOffset + firstIFDOffset;
						}
					}
				}
			}
		}
		if (ifdStart) {
			const length = dataView.getUint16(ifdStart, littleEndian);

			for (let i = 0; i < length; i++) {
				let offset = ifdStart + i * 12 + 2;
				if (dataView.getUint16(offset, littleEndian) === 0x0112 /* Orientation */) {
					// 8 is the offset of the current tag's value
					offset += 8;
					// Get the original orientation value
					orientation = dataView.getUint16(offset, littleEndian);
					// Override the orientation with its default value
					dataView.setUint16(offset, 1, littleEndian);
					break;
				}
			}
		}
		return orientation;
	} catch (error) {
		return null;
	}
}

interface ParseResult {
	src: string;
	arrayBuffer: ArrayBuffer | null;
	revoke: boolean;
	transforms: Transforms;
}

function arrayBufferToDataURL(arrayBuffer) {
	const chunks = [];

	// Chunk Typed Array for better performance
	const chunkSize = 8192;
	let uint8 = new Uint8Array(arrayBuffer);

	while (uint8.length > 0) {
		const value = uint8.subarray(0, chunkSize);
		chunks.push(String.fromCharCode.apply(null, Array.from ? Array.from(value) : value.slice()));
		uint8 = uint8.subarray(chunkSize);
	}

	return `data:image/jpeg;base64,${btoa(chunks.join(''))}`;
}

function getImage({ src, arrayBuffer = null, orientation = null }) {
	const options: ParseResult = {
		src,
		arrayBuffer,
		revoke: false,
		transforms: {
			flip: {
				horizontal: false,
				vertical: false,
			},
			rotate: 0,
		},
	};
	if (arrayBuffer && orientation && orientation > 1 && isLocal(src)) {
		if (isBlob(src)) {
			options.src = URL.createObjectURL(new Blob([arrayBuffer]));
			options.revoke = true;
		} else {
			options.src = arrayBufferToDataURL(arrayBuffer);
		}
	} else {
		options.src = src;
	}
	if (orientation) {
		options.transforms = getTransforms(orientation);
	}
	return options;
}

interface LoadImageSettings {
	crossOrigin?: string | boolean;
	checkOrientation?: boolean;
	parse?: boolean;
}

function parseImage(src: string, settings: LoadImageSettings = {}) {
	const { checkOrientation, parse } = settings;
	return new Promise<ParseResult>((resolve) => {
		if (checkOrientation || parse) {
			getImageData(src)
				.then((data) => {
					const orientation = resetAndGetOrientation(data);
					resolve(
						getImage(
							data
								? { src, arrayBuffer: data, orientation }
								: { src, arrayBuffer: null, orientation: null },
						),
					);
				})
				.catch((error) => {
					console.warn(error);
					resolve(getImage({ src }));
				});
		} else {
			resolve(getImage({ src }));
		}
	});
}

export function loadImage(src: string, settings: LoadImageSettings = {}): Promise<CropperImage> {
	return parseImage(src, settings).then((options) => {
		return new Promise<CropperImage | null>((resolve, reject) => {
			const image = document.createElement('img');

			if (settings.crossOrigin) {
				image.crossOrigin = settings.crossOrigin !== true ? settings.crossOrigin : 'anonymous';
			}

			image.src = options.src;

			image.style.visibility = 'hidden';
			image.style.position = 'fixed';

			document.body.appendChild(image);

			if (image.complete) {
				resolve({
					...options,
					width: image.naturalWidth,
					height: image.naturalHeight,
				});
				document.body.removeChild(image);
			} else {
				image.addEventListener('load', () => {
					resolve({
						...options,
						width: image.naturalWidth,
						height: image.naturalHeight,
					});
					document.body.removeChild(image);
				});

				image.addEventListener('error', () => {
					reject(null);
					document.body.removeChild(image);
				});
			}
		});
	});
}

export function getImageStyle(image: CropperImage, state: CropperState, transitions: CropperTransitions) {
	if (state && image) {
		const optimalImageSize =
			image.width > image.height
				? {
						width: Math.min(512, image.width),
						height: Math.min(512, image.width) / (image.width / image.height),
				  }
				: {
						height: Math.min(512, image.height),
						width: Math.min(512, image.height) * (image.width / image.height),
				  };

		const actualImageSize = getTransformedImageSize(state);

		const imageTransforms = getComputedTransforms(state);

		const coefficient = getCoefficient(state);

		const compensations = {
			rotate: {
				left: (optimalImageSize.width - actualImageSize.width) / (2 * coefficient),
				top: (optimalImageSize.height - actualImageSize.height) / (2 * coefficient),
			},
			scale: {
				left: ((1 - 1 / coefficient) * optimalImageSize.width) / 2,
				top: ((1 - 1 / coefficient) * optimalImageSize.height) / 2,
			},
		};

		const transforms = {
			...imageTransforms,
			scaleX: imageTransforms.scaleX * (image.width / optimalImageSize.width),
			scaleY: imageTransforms.scaleY * (image.height / optimalImageSize.height),
		};

		const result = {
			width: `${optimalImageSize.width}px`,
			height: `${optimalImageSize.height}px`,
			left: '0px',
			top: '0px',
			transition: 'none',
			transform:
				`translate3d(${-compensations.rotate.left - compensations.scale.left - imageTransforms.translateX}px, ${
					-compensations.rotate.top - compensations.scale.top - imageTransforms.translateY
				}px, 0px)` + getStyleTransforms(transforms),
			willChange: 'none',
		};

		if (transitions && transitions.active) {
			result.willChange = 'transform';
			result.transition = `${transitions.duration}ms ${transitions.timingFunction}`;
		}
		return result;
	} else {
		return {};
	}
}

export function getPreviewStyle(
	image: CropperImage,
	state: CropperState,
	transitions: CropperTransitions | null,
	size: Size,
) {
	if (state.coordinates) {
		const coefficient = state.coordinates.width / size.width;
		const transforms = {
			...getComputedTransforms(state),
			scaleX: 1 / coefficient,
			scaleY: 1 / coefficient,
		};
		const width = image.width;
		const height = image.height;
		const virtualSize = rotateSize(
			{
				width,
				height,
			},
			transforms.rotate,
		);
		const result = {
			width: `${width}px`,
			height: `${height}px`,
			left: '0px',
			top: '0px',
			transform: 'none',
			transition: 'none',
		};
		const compensations = {
			rotate: {
				left: ((width - virtualSize.width) * transforms.scaleX) / 2,
				top: ((height - virtualSize.height) * transforms.scaleY) / 2,
			},
			scale: {
				left: ((1 - transforms.scaleX) * width) / 2,
				top: ((1 - transforms.scaleY) * height) / 2,
			},
		};
		result.transform =
			`translate(
				${-state.coordinates.left / coefficient - compensations.rotate.left - compensations.scale.left}px,${
				-state.coordinates.top / coefficient - compensations.rotate.top - compensations.scale.top
			}px) ` + getStyleTransforms(transforms);
		if (transitions && transitions.active) {
			result.transition = `${transitions.duration}ms ${transitions.timingFunction}`;
		}
		return result;
	} else {
		return {};
	}
}

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

export function getMimeType(arrayBuffer, fallback = null) {
	const byteArray = new Uint8Array(arrayBuffer).subarray(0, 4);

	const candidate = imageMimes.find((el) => el.pattern.every((p, i) => !p || byteArray[i] === p));

	return candidate ? candidate.format : fallback;
}
