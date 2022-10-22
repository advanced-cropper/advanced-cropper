import { Coordinates, CropperImage, CropperState, CropperTransitions, Transforms } from '../types';
import { getCoefficient, getTransformedImageSize } from '../service';
import { isBlob, isCrossOriginURL, isLocal } from '../utils';

const XHR_DONE = 4;

function base64ToArrayBuffer(base64: string) {
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

function objectURLToBlob(url: string, callback: (...args: any[]) => void) {
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

function getImageData(img: string) {
	return new Promise<ArrayBuffer>((resolve, reject) => {
		try {
			if (img) {
				if (/^data:/i.test(img)) {
					// Data URL
					resolve(base64ToArrayBuffer(img));
				} else if (/^blob:/i.test(img)) {
					// Blob
					const fileReader = new FileReader();
					fileReader.onload = function (e) {
						resolve(e.target?.result as ArrayBuffer);
					};
					objectURLToBlob(img, function (blob) {
						fileReader.readAsArrayBuffer(blob);
					});
				} else {
					// Simple URL
					const http = new XMLHttpRequest();
					http.onreadystatechange = function () {
						if (http.readyState !== XHR_DONE) return;

						if (http.status === 200 || http.status === 0) {
							resolve(http.response);
						} else {
							reject('Warning: could not load an image to parse its orientation');
						}
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

export function getStyleTransforms(transforms: Partial<Transforms> & { scale?: number }) {
	const { rotate = 0, flip = { horizontal: false, vertical: false }, scale = 1 } = transforms;

	return ` rotate(${rotate}deg) scaleX(${scale * (flip.horizontal ? -1 : 1)}) scaleY(${
		scale * (flip.vertical ? -1 : 1)
	})`;
}

function getStringFromCharCode(dataView: DataView, start: number, length: number) {
	let str = '';
	let i;
	for (i = start, length += start; i < length; i++) {
		str += String.fromCharCode(dataView.getUint8(i));
	}
	return str;
}

function resetAndGetOrientation(arrayBuffer: ArrayBuffer) {
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

function arrayBufferToDataURL(arrayBuffer: ArrayBuffer) {
	const chunks = [];

	// Chunk Typed Array for better performance
	const chunkSize = 8192;
	let uint8 = new Uint8Array(arrayBuffer);

	while (uint8.length > 0) {
		const value = uint8.subarray(0, chunkSize);
		chunks.push(String.fromCharCode.apply(null, (Array.from ? Array.from(value) : value.slice()) as number[]));
		uint8 = uint8.subarray(chunkSize);
	}

	return `data:image/jpeg;base64,${btoa(chunks.join(''))}`;
}

function getImage({
	src,
	arrayBuffer = null,
	orientation = null,
}: {
	src: string;
	orientation?: number | null;
	arrayBuffer?: ArrayBuffer | null;
}) {
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
	if (arrayBuffer && orientation && orientation > 1) {
		if (isBlob(src) || !isLocal(src)) {
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

interface CreateImageSettings {
	crossOrigin?: string | boolean;
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

export function createImage(src: string, settings: CreateImageSettings = {}) {
	return new Promise<HTMLImageElement>((resolve, reject) => {
		const image = document.createElement('img');

		if (settings.crossOrigin) {
			image.crossOrigin = settings.crossOrigin !== true ? settings.crossOrigin : 'anonymous';
		}

		image.src = src;
		image.style.visibility = 'hidden';
		image.style.position = 'fixed';

		document.body.appendChild(image);

		if (image.complete) {
			resolve(image);
			document.body.removeChild(image);
		} else {
			image.addEventListener('load', () => {
				resolve(image);
				document.body.removeChild(image);
			});

			image.addEventListener('error', () => {
				reject(null);
				document.body.removeChild(image);
			});
		}
	});
}

export function loadImage(src: string, settings: LoadImageSettings = {}): Promise<CropperImage> {
	return parseImage(src, { ...settings, crossOrigin: isCrossOriginURL(src) && settings.crossOrigin }).then(
		(options) => {
			return new Promise<CropperImage>((resolve, reject) => {
				createImage(options.src, settings)
					.then((image) => {
						resolve({
							...options,
							width: image.naturalWidth,
							height: image.naturalHeight,
						});
					})
					.catch(() => {
						reject(null);
					});
			});
		},
	);
}

export function getImageStyle(
	image: CropperImage,
	state: CropperState,
	area: Coordinates,
	coefficient: number,
	transitions: CropperTransitions | null = null,
) {
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

	const imageTransforms = {
		rotate: state.transforms.rotate,
		flip: {
			horizontal: state.transforms.flip.horizontal,
			vertical: state.transforms.flip.vertical,
		},
		translateX: area.left / coefficient,
		translateY: area.top / coefficient,
		scale: 1 / coefficient,
	};

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
		scale: imageTransforms.scale * (image.width / optimalImageSize.width),
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
}

export function getBackgroundStyle(
	image: CropperImage,
	state: CropperState,
	transitions: CropperTransitions | null = null,
) {
	if (image && state && state.visibleArea) {
		return getImageStyle(image, state, state.visibleArea, getCoefficient(state), transitions);
	} else {
		return {};
	}
}

export function getPreviewStyle(
	image: CropperImage,
	state: CropperState,
	coefficient: number,
	transitions: CropperTransitions | null = null,
) {
	if (image && state && state.visibleArea && state.coordinates) {
		return getImageStyle(image, state, state.coordinates, coefficient, transitions);
	} else {
		return {};
	}
}
