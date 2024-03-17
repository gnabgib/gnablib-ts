/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { callFrom } from '../primitive/ErrorExt.js';
import { Color } from './tty.js';

interface Option {
	readonly descr: string;
	readonly defValue?: unknown;
	value?: unknown;
}
class Flag implements Option {
	value: boolean;
	constructor(readonly descr: string, readonly defValue = false) {
		this.value = defValue;
	}
}
class Argument {
	value: string | undefined;
	constructor(
		readonly key: string,
		readonly descr: string,
		readonly defValue: string | undefined = undefined
	) {
		this.value = defValue;
	}
}
type Action = () => void;
function exit(): void {
	process.exit(0);
}
type Log = (msg: string) => void;
type ErrorLog = (msg: string) => void;
type IdxType = 'argument' | 'option' | 'alias';

const b = Color.cyan.now();
const y = Color.yellow.now();
const r = Color.red.now();
const d = Color.default.now();

/**
 * Describe a command line interface, by default the flags:
 *  -c,--color,--colour | -h,--help  | -v,--version will be defined
 *
 * If you wish to use the keys (color/help/version) you'll need to .removeOpt
 * If you wish to use the aliases (c/colour/h/v) you'll need to .removeAlias
 */
export class Cli {
	readonly #prog: string[] = [];
	#finalized = false;
	#version: string | undefined;
	/** All options */
	#opts: Map<string, Option> = new Map();
	/** All arguments (required) */
	readonly #args: Argument[] = [];
	/** Map option:aliases (but not the option-key itself) */
	#aliasMap: Map<string, string[]> = new Map();
	/** Resolve index of arguments/options/aliases (must be unique across all) */
	#resIdx: Map<string, IdxType> = new Map();
	/** Rather than throwing errors, we store for later display */
	#error: string | undefined;
	/** Optional stack-trace/line number information of error */
	#errorLine: string | undefined;
	/** Where to log info, used when --help/-h or --version/-v are detected, can be overridden in constructor */
	#log: Log = console.log;
	/** Where to log errors, used when reporting an error, can be overridden by {@link onError}  */
	#logError: ErrorLog = console.error;
	/** Whether to exit (>=0) and what status to exit with when an error is detected, can be overridden by {@link onError} */
	#errExitStatus: number = 1;

	constructor(readonly name: string, readonly descr: string, log?: Log) {
		this.#prog.push(name);
		this.flag('color', "Don't use colors in output", true, 'c', '_colour');
		this.flag('help', 'Display this message', false, 'h');
		this.flag('version', 'Display version information', false, 'v');
		if (log) this.#log = log;
	}

	private cyan(s: string): string {
		return this.optionValue('color') ? b + s + d : s;
	}
	private yellow(s: string): string {
		return this.optionValue('color') ? y + s + d : s;
	}

	get hasError(): boolean {
		return this.#error !== undefined;
	}

	/** Define the version of this CLI, setting twice with fail */
	ver(ver: number | string | undefined): Cli {
		if (this.hasError) return this;
		const strVer = this.cyan(ver === undefined ? '' : '' + ver);
		if (this.#finalized) {
			this.#error = `Cannot set version=${strVer} after finalization`;
			this.#errorLine = callFrom(new Error().stack);
		} else if (this.#version !== undefined && ver !== this.#version) {
			this.#error = `Version already set to ${this.cyan(
				this.#version
			)}, cannot set to ${strVer}`;
			this.#errorLine = callFrom(new Error().stack);
		} else {
			this.#version = ver === undefined ? undefined : '' + ver;
		}
		return this;
	}

	/** Define a required value */
	require(key: string, descr: string, defValue?: string): Cli {
		if (this.hasError) return this;
		if (this.#finalized) {
			this.#error = `Cannot define a required value ${this.cyan(
				key
			)} after finalization`;
			this.#errorLine = callFrom(new Error().stack);
		} else if (this.#resIdx.has(key)) {
			this.#error = `Cannot redefine ${this.cyan(key)}`;
			this.#errorLine = callFrom(new Error().stack);
		} else {
			this.#args.push(new Argument(key, descr, defValue));
			this.#prog.push(key);
			this.#resIdx.set(key, 'argument');
		}
		return this;
	}

	/** Define a flag, and its default value - if default is true you might want to negate the descr language */
	flag(key: string, descr: string, value = false, ...alts: string[]): Cli {
		if (this.hasError) return this;
		if (this.#finalized) {
			this.#error = `Cannot define flag ${this.cyan(key)} after finalization`;
			this.#errorLine = callFrom(new Error().stack);
			return this;
		}
		if (key.startsWith('_')) {
			this.#error =
				'Flag-key cannot be hidden (start with underscore): ' + this.cyan(key);
			this.#errorLine = callFrom(new Error().stack);
			return this;
		}
		const opt = new Flag(descr, value);

		if (this.#resIdx.has(key)) {
			this.#error = `Cannot redefine ${this.cyan(key)}`;
			this.#errorLine = callFrom(new Error().stack);
		}

		this.#opts.set(key, opt);
		this.#resIdx.set(key, 'option');
		for (const alt of alts) {
			//The list makes sure alias can only be used once
			const len = this.#resIdx.size;
			this.#resIdx.set(alt, 'alias');
			if (len == this.#resIdx.size) {
				this.#error = `${alt} already assigned to ${this.#aliasMap.get(alt)}`;
				this.#errorLine = callFrom(new Error().stack);
				return this;
			}
			//Link the alias
			if (!this.#aliasMap.has(key)) this.#aliasMap.set(key, []);
			this.#aliasMap.get(key)?.push(alt);
		}
		return this;
	}

	private resolveAlias(alt: string): string | undefined {
		for (const [key, alts] of this.#aliasMap) {
			if (alts.includes(alt)) return key;
		}
	}

	/** Remove an option from configuration, rarely needed unless you wish to redefine color/version/help */
	removeOpt(...keys: string[]): Cli {
		if (this.hasError) return this;
		if (this.#finalized) {
			this.#error = 'Cannot remove keys after finalization';
			this.#errorLine = callFrom(new Error().stack);
			return this;
		}
		for (const key of keys) {
			if (!this.#opts.has(key)) {
				this.#error =
					'Unable to remove ' + this.cyan(key) + ' - not found as an option';
				this.#errorLine = callFrom(new Error().stack);
				return this;
			}
			//Remove the opt
			this.#opts.delete(key);
			this.#resIdx.delete(key);
			//Remove any aliases
			const alts = this.#aliasMap.get(key);
			if (alts) {
				for (const alt of alts) this.#resIdx.delete(alt);
				this.#aliasMap.delete(key);
			}
		}
		return this;
	}

	/** Remove an alias from configuration, rarely needed unless you wish to redefine c/colour/v/h */
	removeAlt(...alts: string[]): Cli {
		if (this.hasError) return this;
		if (this.#finalized) {
			this.#error = 'Cannot remove keys after finalization';
			this.#errorLine = callFrom(new Error().stack);
			return this;
		}
		for (const alt of alts) {
			if (!this.#resIdx.has(alt)) {
				this.#error = `Cannot remove ${this.cyan(alt)} - not found`;
				this.#errorLine = callFrom(new Error().stack);
				return this;
			}
			for (const [k, alts] of this.#aliasMap) {
				for (let i = 0; i < alts.length; i++) {
					const aliasAlt = alts[i].startsWith('_')
						? alts[i].substring(1)
						: alts[i];
					if (aliasAlt == alt) {
						//Remove the item from the alts
						alts.splice(i, 1);
						//Drop the alias
						this.#resIdx.delete(alt);
						//Clear-up the map if there's no aliases
						if (alts.length == 0) this.#aliasMap.delete(k);
						break;
					}
				}
			}
		}
		return this;
	}

	private getOption(name: string): Option | undefined {
		if (!this.#resIdx.has(name)) return;

		const opt = this.#opts.get(name);
		if (opt) return opt;

		const key = this.resolveAlias(name);
		if (key) return this.#opts.get(key);
	}

	setOption(name: string, value: unknown): void {
		const opt = this.getOption(name);
		if (!opt) throw new Error('Option not found: ' + name);
		opt.value = value;
	}

	/** Get the value of the argument/option/alias */
	value(name: string): unknown | undefined {
		const ty = this.#resIdx.get(name);
		if (ty === undefined) return;
		if (ty == 'argument') {
			for (const arg of this.#args) {
				if (arg.key === name) return arg.value;
			}
		}
		//Either an option or an alias (for option)
		if (ty == 'alias') {
			name = this.resolveAlias(name) ?? '';
		}
		return this.getOption(name)?.value;
	}

	/** Get the value from an option, maybe from parse or from default */
	optionValue(name: string): unknown | undefined {
		return this.#opts.get(name)?.value;
	}

	/** Get all option values - from parse or default */
	optionValues(): [string, unknown][] {
		const ret: [string, unknown][] = [];
		this.#opts.forEach((v, k) => ret.push([k, v.value]));
		return ret;
	}

	private finalize() {
		for (let i = 1; i < this.#prog.length; i++) {
			this.#prog[i] = '[' + this.cyan(this.#prog[i]) + ']';
		}
		if (this.#opts.size > 0) {
			this.#prog.push('[' + this.cyan('OPTIONS') + ']');
		}
		this.#opts = new Map(
			[...this.#opts].sort((a, b) => a[0].localeCompare(b[0]))
		);
		this.#finalized = true;
	}

	/** Collect arguments from the CLI (argv default) starting at index 2 (default) */
	parse(start = 2, args = process.argv): Cli {
		if (!this.#finalized) this.finalize();
		if (this.hasError) return this;
		let argPtr = 0;
		for (let i = start; i < args.length; i++) {
			const arg = args[i];
			if (arg.startsWith('--')) {
				const tArg = arg.substring(2);
				const opt = this.getOption(tArg);
				if (opt instanceof Flag) {
					opt.value = !opt.value;
					continue;
				}
				this.#error = `Not a flag ${this.cyan(tArg)}`;
				//else: deal with other types
			} else if (arg.startsWith('-')) {
				//each char is a flag
				for (let i = 1; i < arg.length; i++) {
					const flag = arg[i];
					const opt = this.getOption(flag);
					if (!opt) {
						this.#error = `Unknown flag ${this.cyan(flag)}`;
						break;
					}
					if (opt instanceof Flag) {
						opt.value = !opt.value;
						continue;
					}
					this.#error = `Not a flag ${this.cyan(flag)}`;
					break;
				}
			} else {
				if (argPtr >= this.#args.length) {
					this.#error = `Unknown argument ${this.cyan(
						(argPtr + 1).toString()
					)}`;
					break;
				}
				this.#args[argPtr++].value = arg;
			}
		}
		//Make sure all required arguments are defined (they will be defined in order defined, if they have
		// a default value that will be used instead, but note order is important)
		// ie. if the first arg as a default, but the second doesn't and parse only has one arg, an error
		//     will be raised (the one found *will not* be applied to the second)
		for (let i = argPtr; i < this.#args.length; i++) {
			if (this.#args[i].value === undefined) {
				this.#error = `Argument '${this.cyan(
					this.#args[i].key
				)}' is required but not defined`;
				break;
			}
		}
		return this;
	}

	error(msg: string, line?: string): void {
		let m = this.optionValue('color') ? r + 'Error' + d : 'Error';
		m += ': ' + msg;
		if (line) m += '\n  ' + line;
		this.#logError(m);
		if (this.#errExitStatus >= 0) process.exit(this.#errExitStatus);
	}

	/** Function to run after arguments specified a complete action (eg `help` or `version`) defaults to  `process.exit(0)` */
	ifComplete(next: Action = exit): Cli {
		//A help or version request outranks an error
		if (this.optionValue('help') === true) {
			this.#log(this.helpBlock());
			next();
			return this;
		}
		if (this.optionValue('version') === true) {
			this.#log(this.versionBlock());
			next();
			return this;
		}
		if (this.#error !== undefined) {
			this.error(this.#error, this.#errorLine);
		}
		return this;
	}

	/** onError, log (to target) and exit with status, defaults to `console.log(err.stack) & process.exist(1)` */
	onError(
		v: {
			/** Where to log an error (default console), note will uses colours */
			target?: ErrorLog;
			/** Exit status code (default 1), a value of -1 will not end processing */
			exitStatus?: number;
		} = {}
	): Cli {
		if (v.target) {
			this.#logError = v.target;
		}
		if (v.exitStatus) {
			this.#errExitStatus = v.exitStatus;
		}
		return this;
	}

	private renderKey(k: string, keys: string[]): number {
		//A key starting with _ is private, so we don't need to render
		//We state the length as -1 (not 0) because as an alt it doesn't have a trailing ,
		if (k.startsWith('_')) return -1;
		if (k.length == 1) {
			keys.unshift('-' + this.cyan(k));
			return k.length + 1;
		} else {
			keys.push('--' + this.cyan(k));
			return k.length + 2;
		}
	}

	private renderArgs(): string[] {
		const args: [string, string][] = [];
		let l0 = 0;
		for (const arg of this.#args) {
			const k = this.cyan(arg.key);
			if (k.length > l0) l0 = k.length;
			args.push([k, arg.descr]);
		}
		const ret = [];
		const pad = ' '.repeat(l0);
		for (const [k, d] of args) {
			ret.push(`  ${(k + pad).substring(0, l0)}  ${d}`);
		}
		return ret;
	}

	private renderOpts(): string[] {
		const opts: [string, number, string][] = [];
		let l0 = 0;
		this.#opts.forEach((o, k) => {
			const keys: string[] = [];
			let len = this.renderKey(k, keys);
			const alts = this.#aliasMap.get(k);
			if (alts) {
				for (const alt of alts) {
					len += this.renderKey(alt, keys) + 1;
				}
			}
			const kStr = keys.join(',');
			if (len > l0) l0 = len;
			opts.push([kStr, len, o.descr]);
		});
		const pad = ' '.repeat(l0);
		const ret: string[] = [];
		for (const [k, n, d] of opts) {
			ret.push(`  ${k + pad.substring(0, l0 - n)}  ${d}`);
		}
		return ret;
	}

	/** Full version block */
	versionBlock(): string {
		return `Version: ${this.yellow(this.#version ?? '0')}\n`;
	}

	/** Full help block */
	helpBlock(): string {
		if (!this.#finalized) this.finalize();
		return (
			'Usage: ' +
			this.#prog.join(' ') +
			'\n' +
			this.descr +
			'\n\n' +
			this.renderArgs().join('\n') +
			'\n\n' +
			'Options:\n' +
			this.renderOpts().join('\n') +
			'\n\n'
		);
	}
}
