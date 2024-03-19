/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

/**
 * Type of config values
 */
export type ConfigValue = boolean | string | number;
/**
 * The value of the related config var will be set to `value`
 */
export type ValueSetter = (value: ConfigValue) => void;

export interface IConfigEnvCollector {
	/**
	 * Explain how to interpret an environment variable, will only be called if environment variables
	 * are available, but note `proc` will be called with `value=undefined` even if that specific environment
	 * variable isn't defined - this allows processing to detect missing environment variables too.
	 *
	 * Because environment variables are stringy, an env with no content would be '' (empty string) not
	 * undefined
	 *
	 * @param key Variable to look for
	 * @param proc How to process the value, which note could be undefined (meaning not set in env)
	 * @returns self (chainable)
	 */
	importEnv(
		key: string,
		proc: (value: string | undefined, set: ValueSetter) => void
	): IConfigEnvCollector;

	/**
	 * Explain how to interpret an environment variable, will only be called if environment variables
	 * are available **and** a variable with this name exists.
	 *
	 * Note because environment variables are stringy, the `value` may still be an empty string.
	 *
	 * @param key Variable to look for
	 * @param proc How to process the value
	 * @returns self (chainable)
	 */
	importAvailEnv(
		key: string,
		proc: (value: string, set: ValueSetter) => void
	): IConfigEnvCollector;
}

export interface IConfigOracle {
	/**
	 * Define a new config variable with default value
	 * @param key Variable name (if already defined, should throw)
	 * @param defaultValue Value if no env imported, no JSON loaded, no calls to {@link IConfigOracle.set}
	 * @param guard If true, access to this item will be logged as a warning
	 * @returns Ability to describe import from env via `importEnv`/`importAvailEnv`
	 */
	define(
		key: string,
		defaultValue: ConfigValue,
		guard?: boolean
	): IConfigEnvCollector;

	/**
	 * Set a config value
	 * @param key Config to set (if not found, should throw)
	 * @param value Value to set to
	 * @param reason Reason for set (reason will be generic if not defined)
	 */
	set(key: string, value: ConfigValue, reason?: string): void;

	/**
	 * Get a config value as a boolean.
	 *
	 * If the value is another type, an info-message will be logged, and `def` will be
	 * returned. If the value is undefined, a debug-message will be logged and `def`
	 * will be returned.
	 *
	 * @param key Config to get (if not found, should return `def`)
	 * @param def Default value used when not found/not boolean
	 * @returns Value (if found&bool) | def
	 */
	getBool(key: string, def?: boolean): boolean;

	/**
	 * Get a config value as an inverted boolean.
	 *
	 * Largely the same as `!{@link getBool}` *except* the found value is inverted (only
	 * - `def` is as-is).  If the value is another type, an info-message will be logged,
	 * and `def` will be returned.  If the value is undefined, a debug-message will be
	 * logged and `def` will be returned.
	 *
	 * @param key Config to get (if not found, should return `def`)
	 * @param def Default value used when not found
	 * @returns Inverted value (if found&bool) | def
	 */
	getInvertedBool(key: string, def?: boolean): boolean;

	/**
	 * Get a config value as a string.
	 *
	 * If the value is another type, an info-message will be logged, and `def` will be
	 * returned. If the value is undefined, a debug-message will be logged and `def`
	 * will be returned.
	 *
	 * @param key Config to get (if not found, should return `def`)
	 * @param def Default value used when not found
	 * @returns Value (if found&string) | def
	 */
	getString(key: string, def?: string): string;

	/**
	 * Retrieve a config value and reason for that value
	 *
	 * @param key Config to get (if not found, should return `undefined`)
	 * @returns [Value, reason] | undefined
	 */
	getValueReason(key: string): [ConfigValue, string] | undefined;
}
