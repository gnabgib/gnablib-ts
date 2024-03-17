/*! Copyright 2024 the gnablib contributors MPL-1.1 */

/* 

ConfigState is shared across all in context (singleton), when defining a new element
 you can assign one or more environment imports (to convert environment variables into the state)

Since state is shared, libraries that depend on this must either use the same meaning for state, or 
choose new unique names.

gnablib only defines 1 state `color:bool=true` - see cli/Tty to decided whether to render colors or not, 
it disables if `NO_COLOR`, `NODE_DISABLE_COLORS`, or `TERM=dumb`

gnablib testing further defines state: `demo:bool=false` to show example outputs when tests are being run,
which is atypical

*/

class ConfigEl {
	#v: unknown;
	reason = 'default';
	constructor(readonly defaultValue: unknown) {
		this.#v = defaultValue;
	}

	get value(): unknown {
		return this.#v;
	}

	// reset(): void {
	// 	this.#v = this.defaultValue;
	// }

	setValue(value: unknown, reason: string) {
		this.#v = value;
		this.reason = reason;
	}
}

type yeeOldeSetter = (v: unknown) => void;

class EnvCollector {
	constructor(readonly el: ConfigEl) {}

	/**
	 * Explain how to interpret an environment variable, will only be called if environment variables
	 * are available, but note `proc` will be called with `value=undefined` even if that specific environment
	 * variable isn't defined - this allows processing to detect missing environment variables too.
     * 
     * Because environment variables are stringy, an env with no content would be '' (empty string) not
     * undefined
	 *
	 * @param key Variable to look for
	 * @param proc How to process the value, which note could be undefined
	 * @returns
	 */
	importEnv(
		key: string,
		proc: (value: string | undefined, set: yeeOldeSetter) => void
	): EnvCollector {
		if (!process) return this;
		//This feels like majority cases, but might need an alt sig to allow undefined to mean something
		//if (!this.el) return this;
		proc(process.env[key], (v) => this.el.setValue(v, 'env.' + key));
		return this;
	}
}

class ConfigState {
	#definitions: Map<string, ConfigEl> = new Map();

	/** Define a new config item, with its default value */
	define<T>(key: string, defaultValue: T): EnvCollector {
		if (this.#definitions.has(key)) throw new Error(`$key already defined`);
		const el = new ConfigEl(defaultValue);
		this.#definitions.set(key, el);
		return new EnvCollector(el);
	}

	set<T>(key: string, value: T, reason?: string): void {
		const d = this.#definitions.get(key);
		if (!d) throw new Error(`$key not found`);
		if (typeof d.value === typeof value) {
			d.setValue(value, reason ?? 'unknown');
		}
	}

	getBool(key: string, def = false): boolean {
		const d = this.#definitions.get(key);
		if (!d) return def;
		return d.value === true;
	}

	getInvertedBool(key: string, def = false): boolean {
		const d = this.#definitions.get(key);
		if (!d) return def;
		return d.value === false;
	}

	/** Get current value and reason of state*/
	getValueReason(key: string): [unknown, string] | undefined {
		const d = this.#definitions.get(key);
		if (!d) return undefined;
		return [d.value, d.reason];
	}
}

export const config = new ConfigState();
