/*! Copyright 2024 the gnablib contributors MPL-1.1 */

export class LengthError extends RangeError {
	readonly available: number;
	readonly key: string;

	/** Invalid length; need $need, have $available */
	constructor(need: number, available: number);
	/** Invalid $name; need $need, have $available */
	constructor(need: number, name: string, available: number);
	/** Invalid $name; Need $eq$need, have $available */
	constructor(need: number, name: string, available: number, eq?: string);

	/** Invalid ($name|length); Need $eq$need, have $available */
	constructor(
		readonly need: number,
		nameOrAvailable: string | number,
		available?: number,
		eq = ''
	) {
		let name = 'length';
		let avail: number;
		if (available !== undefined) {
			name = '' + nameOrAvailable;
			avail = available;
		} else {
			avail = nameOrAvailable as number;
		}
		super(`Invalid ${name}; need ${eq}${need}, have ${avail}`);
		this.key = name;
		this.available = avail;
	}

	/** Invalid $name; need <=$need, have $available */
	static atMost(need: number, name: string, available: number): LengthError {
		return new this(need, name, available, '<=');
	}

	/** Invalid $name; need multiple of $need, have $available */
	static mulOf(need: number, name: string, available: number): LengthError {
		return new this(need, name, available, 'multiple of ');
	}

	/** Invalid $name; need one of ...$need, have $value*/
	static oneOf(need: number[], name: string, value: number): LengthError {
		let pre = need.slice(0, need.length - 1).join(',');
		if (pre.length > 0) pre = 'one of ' + pre + ',';
		return new this(need[need.length - 1], name, value, pre);
	}

	/** @returns "LengthError" */
	get name(): string {
		return 'LengthError';
	}
}
