import * as Utf8 from '../encoding/Utf8.js';
import { OutOfRangeError } from '../primitive/ErrorExt.js';
import { FromBinResult } from '../primitive/FromBinResult.js';

const minLen = 1; //We don't support empty names
const maxLen = 63;

export class TableName {
	readonly name: string;
	private readonly _bytes: Uint8Array;

	private constructor(name: string, bytes: Uint8Array) {
		this.name = name;
		this._bytes = bytes;
	}

	toJSON(): string {
		return this.name;
	}

	toBin(): Uint8Array {
		const ret = new Uint8Array(1 + this._bytes.length);
		ret[0] = this.name.length;
		ret.set(this._bytes, 1);
		return ret;
	}

	/**
	 * Build from a string
	 * @param name
	 * @returns
	 */
	static fromStr(name: string): TableName {
		const bytes = Utf8.toBytes(name);
		if (bytes.length > maxLen || bytes.length < minLen)
			throw new OutOfRangeError(
				'Length in bytes',
				bytes.length,
				minLen,
				maxLen
			);
		return new TableName(name, bytes);
	}

	/**
	 * Build from utf8 encoded bytes
	 * @param utf8bytes
	 * @returns
	 */
	static fromUtf8Bytes(utf8bytes: Uint8Array): TableName {
		if (utf8bytes.length > maxLen || utf8bytes.length < minLen)
			throw new OutOfRangeError(
				'Length in bytes',
				utf8bytes.length,
				minLen,
				maxLen
			);
		const n = Utf8.fromBytes(utf8bytes);
		return new TableName(n, utf8bytes);
	}

	static fromBin(bin: Uint8Array, pos = 0): FromBinResult<TableName> {
		if (pos >= bin.length)
			return new FromBinResult<TableName>(
				0,
				undefined,
				'TableName.fromBin unable to find length byte'
			);

		const l = bin[pos++];
		//Confirm length is within range
		if (l > maxLen || l < minLen)
			return new FromBinResult<TableName>(
				0,
				undefined,
				`TableName.fromBin name size in invalid (${minLen} < ${maxLen} got ${l})`
			);

		const end = pos + l;
		if (end > bin.length)
			return new FromBinResult<TableName>(
				0,
				undefined,
				'TableName.fromBin missing name (not enough data)'
			);

		const b = bin.slice(pos, end);
		const n = Utf8.fromBytes(b);
		//DRY: We duplicate fromUtf8Bytes features, without exceptions (/w l check above) vs try/catch
		return new FromBinResult(l + 1, new TableName(n, b));
	}
}
