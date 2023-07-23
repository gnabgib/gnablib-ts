/*! Copyright 2023 the gnablib contributors MPL-1.1 */

import { safety } from '../primitive/Safety.js';

//Note these are upper bounds of their range, eg debug is 0-63
const debugLevelUpper = 63;
const infoLevelUpper = 127;
const warnLevelUpper = 171;
const errorLevelUpper = 255;

/**
 * Level by which to filter logs
 */
export class LogLevel {
	/**
	 * Log level as a uint8
	 */
	readonly value: number;

	private constructor(lvl: number) {
		this.value = lvl;
	}

	static debug(depth = 0): LogLevel {
		safety.intInRangeInc(depth, 0, 63, 'depth');
		return new LogLevel(debugLevelUpper - depth);
	}

	static info(depth = 0): LogLevel {
		safety.intInRangeInc(depth, 0, 63, 'depth');
		return new LogLevel(infoLevelUpper - depth);
	}

	static warn(depth = 0): LogLevel {
		safety.intInRangeInc(depth, 0, 63, 'depth');
		return new LogLevel(warnLevelUpper - depth);
	}

	static error(depth = 0): LogLevel {
		safety.intInRangeInc(depth, 0, 63, 'depth');
		return new LogLevel(errorLevelUpper - depth);
	}

	asString(): string {
		if (this.value <= debugLevelUpper) return '[DEBUG]';
		if (this.value <= infoLevelUpper) return '[INFO]';
		if (this.value <= warnLevelUpper) return '[WARN]';
		return '[ERROR]';
	}
}
