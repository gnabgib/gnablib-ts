import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../src/codec';
import { Int2, Utf81 } from '../../src/cud';
import {
	CmdCtrlCreate,
	CmdCtrlDrop,
	CmdCtrlInsCols,
	CmdCtrlRemCols,
	CmdDataDelete,
	CmdDataInsert,
	CmdDataPatch,
	CreateColDef,
	ColValue,
	InsertColDef,
	ColName,
	TableName,
	cmdFromBin,
} from '../../src/cud';
import { DateTime } from '../../src/primitive';
import { Ref2 } from '../../src/cud/types';

const tsts = suite('Cud');

const when = DateTime.fromBin(hex.toBytes('04B3B5AEEAA7987D')).value;

const r = new Ref2(TableName.fromStr('people'), ColName.fromStr('ssn'));
console.log(hex.fromBytes(r.toBin()));

const create = new CmdCtrlCreate(
	0,
	when,
	TableName.fromStr('_users'),
	new CreateColDef(ColName.fromStr('id'), new Int2()),
	new CreateColDef(ColName.fromStr('name'), new Utf81()),
	new CreateColDef(
		ColName.fromStr('human'),
		new Ref2(TableName.fromStr('people'), ColName.fromStr('id'))
	)
);

const insert = new CmdDataInsert(
	0,
	when,
	TableName.fromStr('_users'),
	0,
	new ColValue(ColName.fromStr('name'), new Utf81(), 'unknown')
);
const patch = new CmdDataPatch(
	0,
	when,
	TableName.fromStr('_users'),
	1,
	new ColValue(ColName.fromStr('name'), new Utf81(), 'default')
);
const del = new CmdDataDelete(0, when, TableName.fromStr('_users'), 1);
const insCols = new CmdCtrlInsCols(
	0,
	when,
	TableName.fromStr('_users'),
	ColName.fromStr('id'),
	new InsertColDef(ColName.fromStr('farts'), new Utf81(true), 'yes'),
	new InsertColDef(ColName.fromStr('num'), new Int2(), 3)
);
const remCols = new CmdCtrlRemCols(
	0,
	when,
	TableName.fromStr('_users'),
	ColName.fromStr('farts')
);
const drop = new CmdCtrlDrop(0, when, TableName.fromStr('_users'));

// -- As JSON
console.log(JSON.stringify(create));
console.log(JSON.stringify(insert));
console.log(JSON.stringify(patch));
console.log(JSON.stringify(del));
console.log(JSON.stringify(insCols));
console.log(JSON.stringify(remCols));
console.log(JSON.stringify(drop));

// -- As Bin
console.log('--');
const cBin = create.toBin();
const insertBin = insert.toBin();
const patchBin = patch.toBin();
const delBin = del.toBin();
const icBin = insCols.toBin();
const rcBin = remCols.toBin();
const dBin = drop.toBin();
console.log(hex.fromBytes(cBin));
console.log(hex.fromBytes(insertBin));
console.log(hex.fromBytes(patchBin));
console.log(hex.fromBytes(delBin));
console.log(hex.fromBytes(icBin));
console.log(hex.fromBytes(rcBin));
console.log(hex.fromBytes(dBin));

// From bin
console.log('---');
const createFrom = cmdFromBin(cBin);
console.log(JSON.stringify(createFrom.value));
const insColsFrom = cmdFromBin(icBin);
console.log(JSON.stringify(insColsFrom.value));
const remColsFrom = cmdFromBin(rcBin);
console.log(JSON.stringify(remColsFrom.value));
const dropFrom = cmdFromBin(dBin);
console.log(JSON.stringify(dropFrom.value));

console.log('----');
const insertFrom = cmdFromBin(insertBin);
console.log(JSON.stringify(insertFrom.value));
const patchFrom = cmdFromBin(patchBin);
console.log(JSON.stringify(patchFrom.value));
const delFrom = cmdFromBin(delBin);
console.log(JSON.stringify(delFrom.value));

tsts.run();
