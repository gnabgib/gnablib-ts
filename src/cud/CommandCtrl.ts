/*! Copyright 2023 the gnablib contributors MPL-1.1 */

import { DateTime } from '../primitive/DateTime.js';
import { FromBinResult } from '../primitive/FromBinResult.js';
import { ACmd } from './ACmd.js';
import { ColName } from './ColName.js';
import { CreateColDef } from './CreateColDef.js';
import { InsertColDef } from './InsertColDef.js';
import type { TableName } from './TableName.js';
import { CommandCtrl } from './types/Command.js';
import { Plane } from './types/Plane.js';

/**
 * @alpha
 */
export abstract class ACmdCtrl extends ACmd {
	constructor(
		userId: number,
		started: DateTime,
		table: TableName,
		cmd: CommandCtrl
	) {
		super(userId, started, table, Plane.Control, cmd);
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
	): FromBinResult<ACmdCtrl> {
		const c = CommandCtrl.fromByte(cByte);
		if (!c)
			return new FromBinResult<ACmdCtrl>(
				0,
				undefined,
				'ACmdCtrl.fromBinSub missing command'
			);

		if (c.isCreate) {
			return CmdCtrlCreate.fromBinSub(s, cByte, u, t, e, bin, len, pos);
		}
		if (c.isInsCols) {
			return CmdCtrlInsCols.fromBinSub(s, cByte, u, t, e, bin, len, pos);
		}
		if (c.isRemCols) {
			return CmdCtrlRemCols.fromBinSub(s, cByte, u, t, e, bin, len, pos);
		}
		return CmdCtrlDrop.fromBinSub(s, cByte, u, t, e, bin, len, pos);
	}
}

/**
 * @alpha
 */
export class CmdCtrlCreate extends ACmdCtrl {
	readonly cols: CreateColDef[];

	public constructor(
		userId: number,
		started: DateTime,
		table: TableName,
		...cols: CreateColDef[]
	) {
		super(userId, started, table, CommandCtrl.Create);
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

	static Now(
		userId: number,
		table: TableName,
		...cols: CreateColDef[]
	): CmdCtrlCreate {
		return new CmdCtrlCreate(userId, DateTime.now(), table, ...cols);
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
	): FromBinResult<CmdCtrlCreate> {
		let ptr = pos;
		const cols: CreateColDef[] = [];
		let spaceRem = e;
		while (spaceRem > 0) {
			const col = CreateColDef.fromBin(bin, ptr);
			if (!col.success)
				return new FromBinResult<CmdCtrlCreate>(
					0,
					undefined,
					`CmdCtrlCreate.fromBinSub missing col ${cols.length}`
				);
			ptr += col.byteLen;
			spaceRem -= col.byteLen;
			//We know value (because success)
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			cols.push(col.value!);
		}
		return new FromBinResult(len + e, new CmdCtrlCreate(u, s, t, ...cols));
	}
}

/**
 * @alpha
 */
export class CmdCtrlInsCols extends ACmdCtrl {
	readonly after: ColName | undefined;
	readonly cols: InsertColDef[];

	/**
	 *
	 * @param userId
	 * @param started
	 * @param table
	 * @param after If not defined, columns will be inserted at the start
	 * @param cols
	 */
	public constructor(
		userId: number,
		started: DateTime,
		table: TableName,
		after: ColName | undefined,
		...cols: InsertColDef[]
	) {
		super(userId, started, table, CommandCtrl.InsCols);
		this.after = after;
		this.cols = cols;
	}

	toJSON(): Record<string, unknown> {
		const ret = super.toJSON();
		if (this.after !== undefined) {
			ret.after = this.after.name;
		}
		ret.cols = this.cols;
		return ret;
	}

	toBin(): Uint8Array {
		const after = this.after?.toBin();
		const cols = [];
		let colsTotalLen = 0;
		for (const col of this.cols) {
			const colSer = col.toBin();
			cols.push(colSer);
			colsTotalLen += colSer.length;
		}
		const extraSpace = (after?.length ?? 0) + colsTotalLen;

		const ret = super.toBin(extraSpace);
		//Fill in the gap with the column detail
		let ptr = ret.length - extraSpace;
		if (after) {
			ret.set(after, ptr);
			ptr += after.length;
		}
		for (const col of cols) {
			ret.set(col, ptr);
			ptr += col.length;
		}
		return ret;
	}

	static Now(
		userId: number,
		table: TableName,
		after: ColName | undefined,
		...cols: InsertColDef[]
	): CmdCtrlInsCols {
		return new CmdCtrlInsCols(userId, DateTime.now(), table, after, ...cols);
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
	): FromBinResult<CmdCtrlInsCols> {
		let ptr = pos;
		let spaceRem = e;
		const cols: InsertColDef[] = [];
		const aFrom = ColName.fromBin(bin, pos);
		if (!aFrom.success)
			return new FromBinResult<CmdCtrlInsCols>(
				0,
				undefined,
				'CmdCtrlInsCols.fromBinSub missing after-column: ' + aFrom.reason
			);
		ptr += aFrom.byteLen;
		spaceRem -= aFrom.byteLen;

		while (spaceRem > 0) {
			const col = InsertColDef.fromBin(bin, ptr);
			if (!col.success)
				return new FromBinResult<CmdCtrlInsCols>(
					0,
					undefined,
					`CmdCtrlInsCols.fromBinSub missing col ${cols.length}: ${col.reason}`
				);
			ptr += col.byteLen;
			spaceRem -= col.byteLen;
			//We know value (because success)
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			cols.push(col.value!);
		}
		return new FromBinResult(
			len + e,
			new CmdCtrlInsCols(u, s, t, aFrom.value, ...cols)
		);
	}
}

/**
 * @alpha
 */
export class CmdCtrlRemCols extends ACmdCtrl {
	readonly cols: ColName[];

	public constructor(
		userId: number,
		started: DateTime,
		table: TableName,
		...cols: ColName[]
	) {
		super(userId, started, table, CommandCtrl.RemCols);
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

	static Now(
		userId: number,
		table: TableName,
		...cols: ColName[]
	): CmdCtrlRemCols {
		return new CmdCtrlRemCols(userId, DateTime.now(), table, ...cols);
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
	): FromBinResult<CmdCtrlRemCols> {
		let ptr = pos;
		const cols: ColName[] = [];
		let spaceRem = e;
		while (spaceRem > 0) {
			const col = ColName.fromBin(bin, ptr);
			if (!col.success)
				return new FromBinResult<CmdCtrlRemCols>(
					0,
					undefined,
					`CmdCtrlRemCols.fromBinSub missing col ${cols.length}: ${col.reason}`
				);
			ptr += col.byteLen;
			spaceRem -= col.byteLen;
			//We know value (because success)
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			cols.push(col.value!);
		}
		return new FromBinResult(len + e, new CmdCtrlRemCols(u, s, t, ...cols));
	}
}

/**
 * @alpha
 */
export class CmdCtrlDrop extends ACmdCtrl {
	public constructor(userId: number, started: DateTime, table: TableName) {
		super(userId, started, table, CommandCtrl.Drop);
	}

	static Now(userId: number, table: TableName): CmdCtrlDrop {
		return new CmdCtrlDrop(userId, DateTime.now(), table);
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
	): FromBinResult<CmdCtrlDrop> {
		return new FromBinResult(len + e, new CmdCtrlDrop(u, s, t));
	}
}
