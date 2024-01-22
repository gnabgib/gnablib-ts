/*! Copyright 2024 the gnablib contributors MPL-1.1 */

export class ContentError extends SyntaxError {
	readonly key: string;
	readonly value: unknown;

	/** Invalid; $reason */
	constructor(reason: string);
	/** Invalid; $reason ($value) */
	constructor(reason: string, value: unknown);
	/** Invalid $key; $reason ($value) */
	constructor(reason: string, key: string, value: unknown);

	/** Invalid[ $key]; $reason [($value)] */
	constructor(
		readonly reason: string,
		keyOrValue?: string | unknown,
		value?: unknown
	) {
		let key = '';
		let keyPad='';
		let val = '';
		if (value!==undefined) {
			if (keyOrValue) {
				keyPad=' ';
				key = ''+keyOrValue;
			}
			val = ' (' + value + ')';
		} else {
			if (keyOrValue) {
				val = ' (' + keyOrValue + ')';
				value=keyOrValue;
			}
		}
		super(`Invalid${keyPad}${key}; ${reason}${val}`);
		this.key = key;
		this.value = value;
	}
}
