/*! Copyright 2023-2025 the gnablib contributors MPL-1.1 */

import { BitWriter } from '../primitive/BitWriter.js';
import { DateTimeLocal } from '../datetime/dt.js';
import type { TableName } from './TableName.js';
import type { Command } from './types/Command.js';
import type { Plane } from './types/Plane.js';
import { toGlScaleBytes } from '../primitive/number/xtUint.js';

/**
 * @alpha
 */
export abstract class ACmd {
	readonly plane: Plane;
	readonly cmd: Command;
	readonly userId: number;
	readonly table: TableName;

	constructor(
		userId: number,
		readonly started: DateTimeLocal,
		table: TableName,
		plane: Plane,
		cmd: Command
	) {
		this.plane = plane;
		this.cmd = cmd;
		this.userId = userId;
		this.table = table;
	}

	toJSON(): Record<string, unknown> {
		const ret = {
			started: this.started.toString(),
			plane: this.plane.human,
			cmd: this.cmd.human,
			userId: this.userId,
			table: this.table.name,
		};
		return ret;
	}

	toBin(extraSpace = 0): Uint8Array {
		// SSSSSSSSPCU(1-8)T(2-64)E(1-8)<extra 0-?>
		// s = started datetime
		// p = plane
		// c = command
		// u = userId (1-8 scaling bytes)
		// t = table (2-64 byte string: min size+1 char)
		// e = size of extra included (1-8 bytes, even if zero (1B))
		// <extra>
		// min 14 bytes
		// NOTE: You can jump to byte 11 (first, potentially only U) to find the next row (remain are scaled)
		const bytes = new Uint8Array(Math.ceil(DateTimeLocal.serialBits / 8));
		const bw = BitWriter.mount(bytes);
		this.started.serialize(bw);
		//const s = this.started.serialize().toBytesBE();
		const p = this.plane.toBin();
		const c = this.cmd.toBin();
		const u = toGlScaleBytes(this.userId);
		const t = this.table.toBin();
		const e = toGlScaleBytes(extraSpace);

		const ret = new Uint8Array(
			bytes.length +
				p.length +
				c.length +
				u.length +
				t.length +
				e.length +
				extraSpace
		);
		let ptr = 0;
		ret.set(bytes, ptr);
		ptr += bytes.length;
		ret.set(p, ptr++);
		ret.set(c, ptr++);
		ret.set(u, ptr);
		ptr += u.length;
		ret.set(t, ptr);
		ptr += t.length;
		ret.set(e, ptr);
		//Note there's zeros in extra space now
		return ret;
	}
}
