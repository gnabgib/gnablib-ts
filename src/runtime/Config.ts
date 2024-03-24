/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { log } from './Log.js';
import { callFrom } from './callFrom.js';
import {
	ConfigValue,
	IConfigEnvCollector,
	IConfigOracle,
	ValueSetter,
} from './interfaces/ForConfig.js';

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
	readonly typ: string;
	private _v: ConfigValue;
	reason = 'default';
	constructor(
		readonly key: string,
		readonly defaultValue: ConfigValue,
		readonly guard: boolean
	) {
		this.typ = typeof defaultValue;
		this._v = defaultValue;
	}

	get value(): ConfigValue {
		if (this.guard)
			log.warn('guarded config access', { key: this.key, caller: callFrom(2) });
		return this._v;
	}

	valueIfType(typ: string): ConfigValue | undefined {
		if (this.typ !== typ) {
			log.info('incorrect type access', {
				key: this.key,
				have: this.typ,
				seek: typ,
			});
			return;
		}
		if (this.guard)
			log.warn('guarded config access', { key: this.key, caller: callFrom(2) });
		return this._v;
	}

	/** Type checks are done before this call (to prevent stack pollution) */
	setValue(value: ConfigValue, reason: string) {
		this._v = value;
		this.reason = reason;
	}
}

class EnvCollector implements IConfigEnvCollector {
	constructor(readonly el: ConfigEl) {}

	importEnv(
		key: string,
		proc: (value: string | undefined, set: ValueSetter) => void
	): EnvCollector {
		/* c8 ignore next - when this is running in browser, there may not be process, but tricky to test*/
		if (!process) return this;
		proc(process.env[key], (v) => this.el.setValue(v, 'env.' + key));
		return this;
	}

	importAvailEnv(
		key: string,
		proc: (value: string, set: ValueSetter) => void
	): EnvCollector {
		/* c8 ignore next - when this is running in browser, there may not be process, but tricky to test*/
		if (!process) return this;
		const val = process.env[key];
		if (val == undefined) return this;
		proc(val, (v) => this.el.setValue(v, 'env.' + key));
		return this;
	}
}

class ConfigState implements IConfigOracle {
	private _defs: Map<string, ConfigEl> = new Map();

	define(
		key: string,
		defaultValue: ConfigValue,
		guard = false
	): IConfigEnvCollector {
		if (this._defs.has(key)) throw new Error(`$key already defined`);
		const el = new ConfigEl(key, defaultValue, guard);
		this._defs.set(key, el);
		return new EnvCollector(el);
	}

	set(key: string, value: ConfigValue, reason?: string): void {
		const d = this._defs.get(key);
		if (!d) throw new Error(`${key} not found`);
		const vType = typeof value;
		if (vType !== d.typ)
			throw new Error(`${key} is type ${d.typ}, got ${vType}`);
		d.setValue(value, reason ?? 'direct set');
	}

	getBool(key: string, def = false): boolean {
		const d = this._defs.get(key);
		if (!d) {
			log.debug('unknown config', { key });
			return def;
		}
		const v = d.valueIfType('boolean');
		return v == undefined ? def : (v as boolean);
	}

	getInvertedBool(key: string, def = false): boolean {
		const d = this._defs.get(key);
		if (!d) {
			log.debug('unknown config', { key });
			return def;
		}
		const v = d.valueIfType('boolean');
		return v == undefined ? def : (!v as boolean);
	}

	getString(key: string, def = ''): string {
		const d = this._defs.get(key);
		if (!d) {
			log.debug('unknown config', { key });
			return def;
		}
		const v = d.valueIfType('string');
		return v == undefined ? def : (v as string);
	}

	getValueReason(key: string): [ConfigValue, string] | undefined {
		const d = this._defs.get(key);
		if (!d) return undefined;
		return [d.value, d.reason];
	}
}

/**
 * Config oracle (singleton)
 */
export const config: IConfigOracle = new ConfigState();
