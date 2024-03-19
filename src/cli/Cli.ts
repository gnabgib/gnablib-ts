/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { Color } from './tty.js';
import { color } from './csi-tables.js';
import { config } from '../runtime/Config.js';
import { callFrom } from '../runtime/callFrom.js';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _ = Color.blue.now(); //Triggers env checking for no-color etc
const { cyan, yellow: y, red: r, reset } = color;

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

/* c8 ignore next 3 - hard to reasonably test*/
function exit(): void {
	process.exit(0);
}

export type Log = (msg: string) => void;

type IdxType = 'argument' | 'option' | 'alias';

/**
 * Describe a command line interface, by default the flags:
 *  --no-color,--no-colour | -h,--help  | -v,--version will be defined
 *
 * If you wish to use the keys (no-color/help/version) you'll need to .removeOpt
 * If you wish to use the aliases (no-colour/h/v) you'll need to .removeAlias
 */
export class Cli {
	private readonly _prog: string[] = [];
	private _finalized = false;
	private _ver: string | undefined;
	/** All options */
	#opts: Map<string, Option> = new Map();
	/** All arguments (required) */
	private readonly _args: Argument[] = [];
	/** Map option:aliases (but not the option-key itself) */
	private readonly _aliasMap: Map<string, string[]> = new Map();
	/** Resolve index of arguments/options/aliases (must be unique across all) */
	private readonly _resIdx: Map<string, IdxType> = new Map();
	/** Rather than throwing errors, we store for later display */
	private _error: string | undefined;
	/** Optional stack-trace/line number information of error */
	private _errorLine: string | undefined;
	/** Where to log info, used when --help/-h or --version/-v are detected, can be overridden in constructor */
	private _log: Log = console.log;
	/** Where to log errors, used when reporting an error, can be overridden by {@link onError}  */
	private _logError: Log = console.error;
	/** Whether to exit (>=0) and what status to exit with when an error is detected, can be overridden by {@link onError} */
	private _errExitStatus: number = 1;

	constructor(readonly name: string, readonly descr: string, log?: Log) {
		this._prog.push(name);
		this.flag('no-color', "Don't use colors in output", false, '_no-colour');
		this.flag('help', 'Display this message', false, 'h');
		this.flag('version', 'Display version information', false, 'v');
		if (log) this._log = log;
	}

	private cyan(s: string): string {
		return config.getBool('color') ? cyan + s + reset : s;
	}

	get hasError(): boolean {
		return this._error !== undefined;
	}

	/** Define the version of this CLI, setting twice will fail */
	ver(ver: number | string | undefined): Cli {
		if (this.hasError) return this;
		const strVer = this.cyan(ver === undefined ? '' : '' + ver);
		if (this._finalized) {
			this._error = `Cannot set version=${strVer} after finalization`;
			this._errorLine = callFrom();
		} else if (this._ver !== undefined && ver !== this._ver) {
			this._error = `Version already set to ${this.cyan(
				this._ver
			)}, cannot set to ${strVer}`;
			this._errorLine = callFrom();
		} else {
			this._ver = ver === undefined ? undefined : '' + ver;
		}
		return this;
	}

	/** Define a required value */
	require(key: string, descr: string, defValue?: string): Cli {
		if (this.hasError) return this;
		if (this._finalized) {
			this._error = `Cannot define a required value ${this.cyan(
				key
			)} after finalization`;
			this._errorLine = callFrom();
		} else if (this._resIdx.has(key)) {
			this._error = `Cannot redefine ${this.cyan(key)}`;
			this._errorLine = callFrom();
		} else {
			this._args.push(new Argument(key, descr, defValue));
			this._prog.push(key);
			this._resIdx.set(key, 'argument');
		}
		return this;
	}

	/** Define a flag, and its default value - if default is true you might want to negate the descr language */
	flag(key: string, descr: string, value = false, ...alts: string[]): Cli {
		if (this.hasError) return this;
		if (this._finalized) {
			this._error = `Cannot define flag ${this.cyan(key)} after finalization`;
			this._errorLine = callFrom();
			return this;
		}
		if (key.startsWith('_')) {
			this._error =
				'Flag-key cannot be hidden (start with underscore): ' + this.cyan(key);
			this._errorLine = callFrom();
			return this;
		}
		const opt = new Flag(descr, value);

		if (this._resIdx.has(key)) {
			this._error = `Cannot redefine ${this.cyan(key)}`;
			this._errorLine = callFrom();
		}

		this.#opts.set(key, opt);
		this._resIdx.set(key, 'option');
		for (const alt of alts) {
			//The list makes sure alias can only be used once
			const len = this._resIdx.size;
			this._resIdx.set(alt, 'alias');
			if (len == this._resIdx.size) {
				this._error = `${alt} already assigned to ${this._aliasMap.get(alt)}`;
				this._errorLine = callFrom();
				return this;
			}
			//Link the alias
			if (!this._aliasMap.has(key)) this._aliasMap.set(key, []);
			this._aliasMap.get(key)?.push(alt);
		}
		return this;
	}

	private resolveAlias(alt: string): string | undefined {
		for (const [key, alts] of this._aliasMap) {
			if (alts.includes(alt)) return key;
		}
	}

	/** Remove an option from configuration, rarely needed unless you wish to redefine no-color/version/help */
	removeOpt(...keys: string[]): Cli {
		if (this.hasError) return this;
		if (this._finalized) {
			this._error = 'Cannot remove keys after finalization';
			this._errorLine = callFrom();
			return this;
		}
		for (const key of keys) {
			if (!this.#opts.has(key)) {
				this._error =
					'Unable to remove ' + this.cyan(key) + ' - not found as an option';
				this._errorLine = callFrom();
				return this;
			}
			//Remove the opt
			this.#opts.delete(key);
			this._resIdx.delete(key);
			//Remove any aliases
			const alts = this._aliasMap.get(key);
			if (alts) {
				for (const alt of alts) this._resIdx.delete(alt);
				this._aliasMap.delete(key);
			}
		}
		return this;
	}

	/** Remove an alias from configuration, rarely needed unless you wish to redefine no-colour/v/h */
	removeAlt(...alts: string[]): Cli {
		if (this.hasError) return this;
		if (this._finalized) {
			this._error = 'Cannot remove keys after finalization';
			this._errorLine = callFrom();
			return this;
		}
		for (const alt of alts) {
			if (!this._resIdx.has(alt)) {
				this._error = `Cannot remove ${this.cyan(alt)} - not found`;
				this._errorLine = callFrom();
				return this;
			}
			for (const [k, alts] of this._aliasMap) {
				for (let i = 0; i < alts.length; i++) {
					const aliasAlt = alts[i].startsWith('_')
						? alts[i].substring(1)
						: alts[i];
					if (aliasAlt == alt) {
						//Remove the item from the alts
						alts.splice(i, 1);
						//Drop the alias
						this._resIdx.delete(alt);
						//Clear-up the map if there's no aliases
						if (alts.length == 0) this._aliasMap.delete(k);
						break;
					}
				}
			}
		}
		return this;
	}

	private getOption(name: string): Option | undefined {
		if (!this._resIdx.has(name)) return;

		const opt = this.#opts.get(name);
		if (opt) return opt;

		const key = this.resolveAlias(name);
		if (key) return this.#opts.get(key);
	}

	setOption(name: string, value: unknown): Cli {
		const opt = this.getOption(name);
		if (!opt) throw new Error('Option not found: ' + name);
		opt.value = value;
		return this;
	}

	/** Get the value of the argument/option/alias */
	value(name: string): unknown | undefined {
		const ty = this._resIdx.get(name);
		if (ty === undefined) return;
		if (ty == 'argument') {
			for (const arg of this._args) {
				if (arg.key === name) return arg.value;
				/* c8 ignore next 2 - for obvious reasons this will always return before end */
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
		for (let i = 1; i < this._prog.length; i++) {
			this._prog[i] = '[' + this.cyan(this._prog[i]) + ']';
		}
		if (this.#opts.size > 0) {
			this._prog.push('[' + this.cyan('OPTIONS') + ']');
		}
		this.#opts = new Map(
			[...this.#opts].sort((a, b) => a[0].localeCompare(b[0]))
		);
		this._finalized = true;
	}

	/** Collect arguments from the CLI (argv default) starting at index 2 (default) */
	parse(start = 2, args = process.argv): Cli {
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
				this._error = `Not a flag ${this.cyan(tArg)}`;
				//else: deal with other types
			} else if (arg.startsWith('-')) {
				//each char is a flag
				for (let i = 1; i < arg.length; i++) {
					const flag = arg[i];
					const opt = this.getOption(flag);
					if (!opt) {
						this._error = `Unknown flag ${this.cyan(flag)}`;
						break;
					}
					if (opt instanceof Flag) {
						opt.value = !opt.value;
						continue;
					}
					this._error = `Not a flag ${this.cyan(flag)}`;
					break;
				}
			} else {
				if (argPtr >= this._args.length) {
					this._error = `Unknown argument ${this.cyan(
						(argPtr + 1).toString()
					)}`;
					break;
				}
				this._args[argPtr++].value = arg;
			}
		}
		//React to any arguments here
		if (this.optionValue('no-color') === true) {
			config.set('color', false, 'set by --no-color');
		}
		if (!this._finalized) this.finalize();

		//Make sure all required arguments are defined (they will be defined in order defined, if they have
		// a default value that will be used instead, but note order is important)
		// ie. if the first arg as a default, but the second doesn't and parse only has one arg, an error
		//     will be raised (the one found *will not* be applied to the second)
		for (let i = argPtr; i < this._args.length; i++) {
			if (this._args[i].value === undefined) {
				this._error = `Argument '${this.cyan(
					this._args[i].key
				)}' is required but not defined`;
				break;
			}
		}
		return this;
	}

	error(msg: string, line?: string): void {
		let m = 'Error';
		if (config.getBool('color')) m = r + m + reset;
		m += ': ' + msg;
		if (line) m += '\n  ' + line;
		this._logError(m);
		if (this._errExitStatus >= 0) process.exit(this._errExitStatus);
	}

	/**
	 * Call after arguments specified, and {@link parse} has been called.  If arguments
	 * result in a final action (eg `help` or `version`) then `next` will be called.
	 * @param next What to call after a finishing action, by default `process.exit(0)`
	 * @returns Self (chainable)
	 */
	ifComplete(next: () => void = exit): Cli {
		//A help or version request outranks an error
		if (this.optionValue('help') === true) {
			this._log(this.helpBlock());
			next();
			return this;
		}
		if (this.optionValue('version') === true) {
			this._log(this.versionBlock());
			next();
			return this;
		}
		if (this._error !== undefined) {
			this.error(this._error, this._errorLine);
		}
		return this;
	}

	/** onError, log (to target) and exit with status, defaults to `console.log(err.stack) & process.exist(1)` */
	onError(
		v: {
			/** Where to log an error (default console), note will uses colours */
			target?: Log;
			/** Exit status code (default 1), a value of -1 will not end processing */
			exitStatus?: number;
		} = {}
	): Cli {
		if (v.target) {
			this._logError = v.target;
		}
		if (v.exitStatus) {
			this._errExitStatus = v.exitStatus;
		}
		return this;
	}

	private renderKey(k: string, keys: string[]): number {
		//A key starting with _ is private, so we don't need to render
		//We state the length as -1 (not 0) because as an alt it doesn't have a trailing ,
		if (k.startsWith('_')) return -1;
		if (k.length == 1) {
			//Add to start
			keys.unshift('-' + this.cyan(k));
			return k.length + 1;
		} else {
			//Add to end
			keys.push('--' + this.cyan(k));
			return k.length + 2;
		}
	}

	private renderArgs(): string[] {
		const args: [string, string][] = [];
		let l0 = 0;
		for (const arg of this._args) {
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
			const alts = this._aliasMap.get(k);
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
		let v = this._ver ?? 0;
		if (config.getBool('color')) v = y + v + reset;
		return 'Version: ' + v + '\n';
	}

	/** Full help block */
	helpBlock(): string {
		if (!this._finalized) this.finalize();
		return (
			'Usage: ' +
			this._prog.join(' ') +
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
