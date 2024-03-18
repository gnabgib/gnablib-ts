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
	private _v: unknown;
	reason = 'default';
	constructor(readonly defaultValue: unknown) {
		this._v = defaultValue;
	}

	get value(): unknown {
		return this._v;
	}

	setValue(value: unknown, reason: string) {
		this._v = value;
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
	 * @returns self (chainable)
	 */
	importEnv(
        /** Environment variable to look for */
		key: string,
        /** What to do if variables are available (if `key` wasn't found `value`===undefined) */
		proc: (value: string | undefined, set: yeeOldeSetter) => void
	): EnvCollector {
		if (!process) return this;
		//This feels like majority cases, but might need an alt sig to allow undefined to mean something
		//if (!this.el) return this;
		proc(process.env[key], (v) => this.el.setValue(v, 'env.' + key));
		return this;
	}

    /**
     * Explain how to interpret an environment variable, will only be called if environment variables
     * are available **and** a variable with this name exists.
     * 
     * Note because environment variables are stringy, the `value` may still be an empty string.
     * 
     * @param key 
     * @param proc 
     * @returns self (chainable)
     */
    importAvailEnv(
        /** Environment variable to look for */
        key:string,
        /** What to do if the variable is found */
        proc:(value:string,set:yeeOldeSetter)=>void
    ):EnvCollector {
        if (!process) return this;
        const val=process.env[key];
        if (val===undefined) return this;
		proc(val, (v) => this.el.setValue(v, 'env.' + key));
		return this;
    }
}

class ConfigState {
	private _defns: Map<string, ConfigEl> = new Map();

    /**
     * 
     * @param key 
     * @param defaultValue 
     * @returns 
     */
	define<T>(key: string, defaultValue: T): EnvCollector {
		if (this._defns.has(key)) throw new Error(`$key already defined`);
		const el = new ConfigEl(defaultValue);
		this._defns.set(key, el);
		return new EnvCollector(el);
	}

	set<T>(key: string, value: T, reason?: string): void {
		const d = this._defns.get(key);
		if (!d) throw new Error(`$key not found`);
		if (typeof d.value === typeof value) {
			d.setValue(value, reason ?? 'unknown');
		}
	}

	getBool(key: string, def = false): boolean {
		const d = this._defns.get(key);
		if (!d) return def;
		return d.value === true;
	}

	getInvertedBool(key: string, def = false): boolean {
		const d = this._defns.get(key);
		if (!d) return def;
		return d.value === false;
	}

	/** Get current value and reason of state*/
	getValueReason(key: string): [unknown, string] | undefined {
		const d = this._defns.get(key);
		if (!d) return undefined;
		return [d.value, d.reason];
	}
}

export const config = new ConfigState();
