/*! Copyright 2023 the gnablib contributors MPL-1.1 */

/**
 * Build something upon first access to .value property (cache the result)
 * @param factory Builder to call on first access
 */
export class Lazy<T> {
	private _built = false;
	private _value!: T; //Prevent TS2564 with !
	/** Provide a factory to create a value upon first access */
	constructor(private factory: () => T) {}
	get value() {
		if (!this._built) {
			this._value = this.factory();
			this._built = true;
		}
		return this._value;
	}
}
