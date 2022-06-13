import {
	CardinalDirection,
	HorizontalCardinalDirection,
	OrdinalDirection,
	Point,
	VerticalCardinalDirection,
} from './types';

type Protocol = 'http' | 'https';

export function getDirectionNames(
	hDirection?: HorizontalCardinalDirection | null,
	vDirection?: VerticalCardinalDirection | null,
) {
	let camelCase, snakeCase;
	if (hDirection && vDirection) {
		camelCase = `${hDirection}${vDirection[0].toUpperCase()}${vDirection.slice(1)}` as OrdinalDirection;
		snakeCase = `${hDirection}-${vDirection}` as string;
	} else {
		camelCase = hDirection || vDirection;
		snakeCase = hDirection || vDirection;
	}
	return { camelCase, snakeCase };
}

export function isBlob(url: string) {
	return /^blob:/.test(url);
}

export function isDataUrl(url: string) {
	return /^data:/.test(url);
}

export function isLocal(url: string) {
	return isBlob(url) || isDataUrl(url);
}

export function isCrossOriginURL(url: string) {
	if (isLocal(url)) {
		return false;
	}
	const pageLocation = window.location;
	const URL_HOST_PATTERN = /(\w+:)?(?:\/\/)([\w.-]+)?(?::(\d+))?\/?/;
	const urlMatch = URL_HOST_PATTERN.exec(url) || [];
	const urlparts = {
		protocol: urlMatch[1] || '',
		host: urlMatch[2] || '',
		port: urlMatch[3] || '',
	};

	const defaultPort = (protocol: Protocol) => {
		if (protocol === 'http') {
			return 80;
		} else {
			return 433;
		}
	};

	const portOf = (location: any) => {
		return location.port || defaultPort((location.protocol || pageLocation.protocol) as Protocol);
	};

	return !(
		(!urlparts.protocol && !urlparts.host && !urlparts.port) ||
		Boolean(
			urlparts.protocol &&
				urlparts.protocol == pageLocation.protocol &&
				urlparts.host &&
				urlparts.host == pageLocation.host &&
				urlparts.host &&
				portOf(urlparts) == portOf(pageLocation),
		)
	);
}

export function isArray<T, U>(value: Array<T> | U): value is Array<T> {
	return Array.isArray(value);
}

export function isFunction<T extends Function, U>(value: T | U): value is T {
	return typeof value === 'function';
}

export function isUndefined(obj: unknown): obj is undefined {
	return obj === undefined;
}

export const isObject = <T extends object, U>(term: T | U): term is NonNullable<T> => {
	return term !== null && typeof term === 'object';
};

// TODO: add the typing
export function getOptions(options: any, defaultScheme: any, falseScheme: any = {}) {
	const result: any = {};
	if (isObject(options)) {
		Object.keys(defaultScheme).forEach((key) => {
			if (isUndefined(options[key])) {
				result[key] = defaultScheme[key];
			} else if (isObject(defaultScheme[key])) {
				if (isObject(options[key])) {
					result[key] = getOptions(options[key], defaultScheme[key], falseScheme[key]);
				} else {
					result[key] = options[key] ? defaultScheme[key] : falseScheme[key];
				}
			} else if (defaultScheme[key] === true || defaultScheme[key] === false) {
				result[key] = Boolean(options[key]);
			} else {
				result[key] = options[key];
			}
		});
		return result;
	} else {
		if (options) {
			return defaultScheme;
		} else {
			return falseScheme;
		}
	}
}

export function parseNumber(number: string | number) {
	const parsedNumber = Number(number);
	if (Number.isNaN(parsedNumber)) {
		return number as number;
	} else {
		return parsedNumber;
	}
}

export function isNumber(value: unknown): value is number {
	return typeof value === 'number';
}

export const isString = <T>(value: string | T): value is string => {
	return typeof value === 'string';
};

export function isNaN(value: unknown) {
	return value !== value;
}

export function isNumeric(value: unknown): value is number | string {
	return (
		(isNumber(value) && !isNaN(value)) ||
		(isString(value) && !Number.isNaN(parseFloat(value)) && isFinite(parseFloat(value)))
	);
}

export function distance(firstPoint: Point, secondPoint: Point) {
	return Math.sqrt(Math.pow(firstPoint.left - secondPoint.left, 2) + Math.pow(firstPoint.top - secondPoint.top, 2));
}

export function isRoughlyEqual(a: number, b: number, tolerance = 1e-3): boolean {
	return Math.abs(b - a) < Math.max(tolerance, tolerance * Math.max(Math.abs(a), Math.abs(b)));
}

export function isGreater(a: number, b: number, tolerance?: number): boolean {
	return isRoughlyEqual(a, b, tolerance) ? false : a > b;
}

export function isLower(a: number, b: number, tolerance?: number): boolean {
	return isRoughlyEqual(a, b, tolerance) ? false : a < b;
}

export function isArrayBufferLike(value: unknown): value is ArrayBufferLike {
	return value instanceof ArrayBuffer;
}

export function sign(value: number) {
	const number = +value;
	if (number === 0 || isNaN(number)) {
		return number;
	}
	return number > 0 ? 1 : -1;
}

export function promiseTimeout(timeout: number) {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve();
		}, timeout);
	});
}

// Not performant, small function to reduce code amount
export function deepClone<T>(obj: T): T {
	if (!isObject(obj)) {
		return obj;
	}
	let result: any = {};
	if (Array.isArray(obj)) {
		result = obj.map((item) => deepClone(item));
	} else {
		Object.keys(obj).forEach((key) => {
			return (result[key] = deepClone(obj[key as keyof typeof obj]));
		});
	}
	return result;
}

export function deepCompare(a: any, b: any) {
	if (a === b) return true;

	if (a && b && typeof a == 'object' && typeof b == 'object') {
		if (a.constructor !== b.constructor) return false;

		let length, i;
		if (Array.isArray(a)) {
			length = a.length;
			if (length != b.length) return false;
			for (i = length; i-- !== 0; ) if (!deepCompare(a[i], b[i])) return false;
			return true;
		}

		if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
		if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();

		const keys = Object.keys(a);
		length = keys.length;
		if (length !== Object.keys(b).length) return false;

		for (i = length; i-- !== 0; ) if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;

		for (i = length; i-- !== 0; ) {
			const key = keys[i];
			if (!deepCompare(a[key], b[key])) return false;
		}

		return true;
	}

	return a !== a && b !== b;
}

export function mapObject<T extends object, V>(obj: T, callback: <K extends keyof T>(value: T[K], key: K) => V) {
	const result = {} as { [K in keyof T]: V };
	(Object.keys(obj) as Array<keyof T>).forEach((name) => {
		result[name] = callback(obj[name], name);
	});
	return result;
}

export function isWheelEvent(event: Event): event is WheelEvent {
	return 'deltaX' in event;
}

export function isTouchEvent(event: Event): event is TouchEvent {
	return 'touches' in event;
}

export function isMouseEvent(event: Event): event is MouseEvent {
	return 'buttons' in event;
}

export function emptyCoordinates() {
	return {
		left: 0,
		top: 0,
		width: 0,
		height: 0,
	};
}

export function isCardinalDirection(value: unknown): value is CardinalDirection {
	return value === 'west' || value === 'south' || value === 'north' || value === 'east';
}

export function isOrdinalDirection(value: unknown): value is OrdinalDirection {
	return (
		isCardinalDirection(value) ||
		value === 'westNorth' ||
		value === 'westSouth' ||
		value === 'eastNorth' ||
		value === 'eastSouth'
	);
}

export function debounce(callback: () => void, delay?: number | (() => number)) {
	let timestamp: number;
	let timeout: ReturnType<typeof setTimeout>;

	function later() {
		const last = Date.now() - timestamp;
		const delayValue = isFunction(delay) ? delay() : delay || 0;

		if (last < delayValue && last >= 0) {
			timeout = setTimeout(later, delayValue - last);
		} else {
			callback();
		}
	}

	const result = () => {
		timestamp = Date.now();
		setTimeout(later, isFunction(delay) ? delay() : delay);
	};

	result.clear = () => {
		clearTimeout(timeout);
	};

	return result;
}
