/*! Copyright 2023 gnabgib MPL-2.0 */

import { DateTime } from '../primitive/DateTime.js';
import { FromBinResult } from '../primitive/FromBinResult.js';
import { intExt } from '../primitive/IntExt.js';
import { ACmd } from './ACmd.js';
import { ColValue } from './ColValue.js';
import type { TableName } from './TableName.js';
import { CommandData } from './types/Command.js';
import { Plane } from './types/Plane.js';

/**
 * @alpha
 */
export abstract class ACmdData extends ACmd {
	readonly recId: number;

	constructor(
		userId: number,
		started: DateTime,
		table: TableName,
		recId: number,
		cmd: CommandData
	) {
		super(userId, started, table, Plane.Data, cmd);
		this.recId = recId;
	}

	toJSON(): Record<string, unknown> {
		//Always include the rowId
		const ret = super.toJSON();
		ret.recId = this.recId;
		return ret;
	}

	toBin(extraSpace = 0): Uint8Array {
		//Always include the rowId (in extra)
		const i = intExt.uintToScaleBytes(this.recId);
		const finalExtraSpace = i.length + extraSpace;
		const ret = super.toBin(finalExtraSpace);
		ret.set(i, ret.length - finalExtraSpace);
		return ret;
	}

	static fromBinSub(
		s: DateTime,
		cByte: number,
		u: number,
		t: TableName,
		e: number,
		bin: Uint8Array,
		len: number,
		pos: number
	): FromBinResult<ACmdData> {
		const c = CommandData.fromByte(cByte);
		if (!c)
			return new FromBinResult<ACmdData>(
				0,
				undefined,
				'ACmdData.fromBinSub missing command'
			);

		if (c.isInsert) {
			return CmdDataInsert.fromBinSub(s, cByte, u, t, e, bin, len, pos);
		}
		if (c.isPut) {
			return CmdDataPut.fromBinSub(s, cByte, u, t, e, bin, len, pos);
		}
		if (c.isPatch) {
			return CmdDataPatch.fromBinSub(s, cByte, u, t, e, bin, len, pos);
		}
		return CmdDataDelete.fromBinSub(s, cByte, u, t, e, bin, len, pos);
	}
}

abstract class ADataCols extends ACmdData {
	readonly cols: ColValue[];

	public constructor(
		userId: number,
		started: DateTime,
		table: TableName,
		recId: number,
		cmd: CommandData,
		...cols: ColValue[]
	) {
		super(userId, started, table, recId, cmd);
		this.cols = cols;
	}

	toJSON(): Record<string, unknown> {
		const ret = super.toJSON();
		ret.cols = this.cols;
		return ret;
	}

	toBin(): Uint8Array {
		const cols = [];
		let colsTotalLen = 0;
		for (const col of this.cols) {
			const colSer = col.toBin();
			cols.push(colSer);
			colsTotalLen += colSer.length;
		}

		const ret = super.toBin(colsTotalLen);
		//Fill in the gap with the column detail
		let ptr = ret.length - colsTotalLen;
		for (const col of cols) {
			ret.set(col, ptr);
			ptr += col.length;
		}
		return ret;
	}
}

/**
 * @alpha
 */
export class CmdDataInsert extends ADataCols {
	public constructor(
		userId: number,
		started: DateTime,
		table: TableName,
		recId: number,
		...cols: ColValue[]
	) {
		super(userId, started, table, recId, CommandData.Insert, ...cols);
	}

	static Now(
		userId: number,
		table: TableName,
		recId: number,
		...cols: ColValue[]
	): CmdDataInsert {
		return new CmdDataInsert(userId, DateTime.now(), table, recId, ...cols);
	}

	static fromBinSub(
		s: DateTime,
		cByte: number,
		u: number,
		t: TableName,
		e: number,
		bin: Uint8Array,
		len: number,
		pos: number
	): FromBinResult<CmdDataInsert> {
		let ptr = pos;
		let spaceRem = e;
		const iFrom = intExt.uintFromScaleBytes(bin, ptr);
		if (!iFrom.success)
			return new FromBinResult<CmdDataInsert>(
				0,
				undefined,
				`CmdDataInsert.fromBinSub missing recId: ${iFrom.reason}`
			);
		ptr += iFrom.byteLen;
		spaceRem -= iFrom.byteLen;

		const cols: ColValue[] = [];
		while (spaceRem > 0) {
			const col = ColValue.fromBin(bin, ptr);
			if (!col.success) {
				return new FromBinResult<CmdDataInsert>(
					0,
					undefined,
					`CmdDataInsert.fromBinSub missing col ${cols.length}: ${col.reason}`
				);
			}
			ptr += col.byteLen;
			spaceRem -= col.byteLen;
			//We know value (because success)
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			cols.push(col.value!);
		}
		return new FromBinResult(
			len + e,
			//We know value (because success)
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			new CmdDataInsert(u, s, t, iFrom.value!, ...cols)
		);
	}
}

/**
 * @alpha
 */
export class CmdDataPut extends ADataCols {
	public constructor(
		userId: number,
		started: DateTime,
		table: TableName,
		recId: number,
		...cols: ColValue[]
	) {
		super(userId, started, table, recId, CommandData.Put, ...cols);
	}

	static Now(
		userId: number,
		table: TableName,
		recId: number,
		...cols: ColValue[]
	): CmdDataPut {
		return new CmdDataPut(userId, DateTime.now(), table, recId, ...cols);
	}

	static fromBinSub(
		s: DateTime,
		cByte: number,
		u: number,
		t: TableName,
		e: number,
		bin: Uint8Array,
		len: number,
		pos: number
	): FromBinResult<CmdDataPut> {
		let ptr = pos;
		let spaceRem = e;
		const iFrom = intExt.uintFromScaleBytes(bin, ptr);
		if (!iFrom.success)
			return new FromBinResult<CmdDataPut>(
				0,
				undefined,
				`CmdDataPut.fromBinSub missing recId: ${iFrom.reason}`
			);
		ptr += iFrom.byteLen;
		spaceRem -= iFrom.byteLen;

		const cols: ColValue[] = [];
		while (spaceRem > 0) {
			const col = ColValue.fromBin(bin, ptr);
			if (!col.success)
				return new FromBinResult<CmdDataPut>(
					0,
					undefined,
					`CmdDataPut.fromBinSub missing col ${cols.length}: ${col.reason}`
				);
			ptr += col.byteLen;
			spaceRem -= col.byteLen;
			//We know value (because success)
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			cols.push(col.value!);
		}
		return new FromBinResult(
			len + e,
			//We know value (because success)
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			new CmdDataPut(u, s, t, iFrom.value!, ...cols)
		);
	}
}

/**
 * @alpha
 */
export class CmdDataPatch extends ADataCols {
	public constructor(
		userId: number,
		started: DateTime,
		table: TableName,
		recId: number,
		...cols: ColValue[]
	) {
		super(userId, started, table, recId, CommandData.Patch, ...cols);
	}

	static Now(
		userId: number,
		table: TableName,
		recId: number,
		...cols: ColValue[]
	): CmdDataPatch {
		return new CmdDataPatch(userId, DateTime.now(), table, recId, ...cols);
	}

	static fromBinSub(
		s: DateTime,
		cByte: number,
		u: number,
		t: TableName,
		e: number,
		bin: Uint8Array,
		len: number,
		pos: number
	): FromBinResult<CmdDataPatch> {
		let ptr = pos;
		let spaceRem = e;
		const iFrom = intExt.uintFromScaleBytes(bin, ptr);
		if (!iFrom.success)
			return new FromBinResult<CmdDataPatch>(
				0,
				undefined,
				`CmdDataPatch.fromBinSub missing recId: ${iFrom.reason}`
			);
		ptr += iFrom.byteLen;
		spaceRem -= iFrom.byteLen;

		const cols: ColValue[] = [];
		while (spaceRem > 0) {
			const col = ColValue.fromBin(bin, ptr);
			if (!col.success)
				return new FromBinResult<CmdDataPatch>(
					0,
					undefined,
					`CmdDataPatch.fromBinSub missing col ${cols.length}`
				);
			ptr += col.byteLen;
			spaceRem -= col.byteLen;
			//We know value (because success)
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			cols.push(col.value!);
		}
		return new FromBinResult(
			len + e,
			//We know value (because success)
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			new CmdDataPatch(u, s, t, iFrom.value!, ...cols)
		);
	}
}

/**
 * @alpha
 */
export class CmdDataDelete extends ACmdData {
	public constructor(
		userId: number,
		started: DateTime,
		table: TableName,
		recId: number
	) {
		super(userId, started, table, recId, CommandData.Delete);
	}

	static Now(userId: number, table: TableName, recId: number): CmdDataDelete {
		return new CmdDataDelete(userId, DateTime.now(), table, recId);
	}

	static fromBinSub(
		s: DateTime,
		cByte: number,
		u: number,
		t: TableName,
		e: number,
		bin: Uint8Array,
		len: number,
		pos: number
	): FromBinResult<CmdDataDelete> {
		let ptr = pos;
		const iFrom = intExt.uintFromScaleBytes(bin, ptr);
		if (!iFrom.success)
			return new FromBinResult<CmdDataDelete>(
				0,
				undefined,
				`CmdDataDelete.fromBinSub missing recId: ${iFrom.reason}`
			);
		ptr += iFrom.byteLen;
		//Check ptr==e?
		//We know value (because success)
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		return new FromBinResult(len + e, new CmdDataDelete(u, s, t, iFrom.value!));
	}
}
