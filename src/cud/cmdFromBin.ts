/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import { FromBinResult } from '../primitive/FromBinResult.js';
import { intExt } from '../primitive/xtInt.js';
import { TableName } from './TableName.js';
import { Plane } from './types/Plane.js';
import { ACmdData } from './CommandData.js';
import type { ACmd } from './ACmd.js';
import { ACmdCtrl } from './CommandCtrl.js';
import { DateTimeLocal } from '../datetime/dt.js';
import { BitReader } from '../primitive/BitReader.js';

export function cmdFromBin(bin: Uint8Array, pos = 0): FromBinResult<ACmd> {
	//S, P, C, U, T, E are always parsed, although C is P dependent (so leave)
	let s: DateTimeLocal;
	let ptr = pos;
	const br = BitReader.mount(bin);
	try {
		s = DateTimeLocal.deserialize(br);
	} catch {
		return new FromBinResult<ACmd>(
			0,
			undefined,
			'cmdFromBin failed to parse DateTime'
		);
	}
	ptr += 8;

	const pFrom = Plane.fromBin(bin, ptr);
	if (!pFrom.success)
		return new FromBinResult<ACmd>(
			0,
			undefined,
			'cmdFromBin missing plane: ' + pFrom.reason
		);
	ptr += pFrom.byteLen;

	//Parse later
	const cByte = bin[ptr];
	ptr += 1;

	const uFrom = intExt.uintFromScaleBytes(bin, ptr);
	if (!uFrom.success)
		return new FromBinResult<ACmd>(
			0,
			undefined,
			'cmdFromBin missing userId: ' + uFrom.reason
		);
	ptr += uFrom.byteLen;

	const tFrom = TableName.fromBin(bin, ptr);
	if (!tFrom.success)
		return new FromBinResult<ACmd>(
			0,
			undefined,
			'cmdFromBin missing table: ' + tFrom.reason
		);
	ptr += tFrom.byteLen;

	const eFrom = intExt.uintFromScaleBytes(bin, ptr);
	if (!eFrom.success)
		return new FromBinResult<ACmd>(
			0,
			undefined,
			'cmdFromBin missing extra: ' + eFrom.reason
		);
	ptr += eFrom.byteLen;

	//We know values (because success)
	if (pFrom.value!.isCtrl) {
		return ACmdCtrl.fromBinSub(
			s,
			cByte,
			uFrom.value!,
			tFrom.value!,
			eFrom.value!,
			bin,
			ptr - pos,
			ptr
		);
	} else {
		return ACmdData.fromBinSub(
			s,
			cByte,
			uFrom.value!,
			tFrom.value!,
			eFrom.value!,
			bin,
			ptr - pos,
			ptr
		);
	}

	// let cFrom:FromBinResult<Command>;
	// if (pFrom.value.isCtrl) {
	//     cFrom=CommandCtrl.fromBin(bin,ptr);
	// } else {
	//     cFrom=CommandData.fromBin(bin,ptr);
	// }
	// if (!cFrom.success) return new FromBinResult(0);
	// ptr+=cFrom.bytes;
	// //todo: extra
	// if (pFrom.value.isCtrl) {
	//     const c=cFrom.value as CommandCtrl;
	//     if (c.isCreate) {
	//         return new FromBinResult(ptr-pos,new CmdCtrlCreate(uFrom.value,s,tFrom.value));
	//     }
	//     if (c.isDrop) {
	//         return new FromBinResult(ptr-pos,new CmdCtrlDrop(uFrom.value,s,tFrom.value));
	//     }
	// }
}
