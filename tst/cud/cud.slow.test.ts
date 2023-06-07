import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Hex } from '../../src/encoding/Hex';
//import * as utf8 from '../../src/encoding/Utf8';
import * as bigEndian from '../../src/endian/big';
import { Int2 } from '../../src/cud/types/Int';
import { Utf81 } from '../../src/cud/types/Utf8';
import {
	CmdCtrlCreate,
	CmdCtrlDrop,
	CmdCtrlInsCols,
	CmdCtrlRemCols
} from '../../src/cud/CommandCtrl';
import { CmdDataDelete, CmdDataInsert, CmdDataPatch } from '../../src/cud/CommandData';
import { CreateColDef } from '../../src/cud/CreateColDef';
import { ColValue } from '../../src/cud/ColValue';
import { InsertColDef } from '../../src/cud/InsertColDef';
import { ColName } from '../../src/cud/ColName';
import { DateTime } from '../../src/primitive/DateTime';
import { TableName } from '../../src/cud/TableName';
import { cmdFromBin } from '../../src/cud/cmdFromBin';
import { Ref2 } from '../../src/cud/types/Ref';
import { Uint64 } from '../../src/primitive/Uint64';

const tsts = suite('Cud');

const when = DateTime.fromBin(Hex.toBytes('04B3B5AEEAA7987D')).value;

const r=new Ref2(TableName.fromStr('people'),ColName.fromStr('ssn'));
console.log(Hex.fromBytes(r.toBin()));

const create = new CmdCtrlCreate(
	0,
	when,
    TableName.fromStr('_users'),
	new CreateColDef(ColName.fromStr('id'), new Int2()),
	new CreateColDef(ColName.fromStr('name'), new Utf81()),
    new CreateColDef(ColName.fromStr('human'),new Ref2(TableName.fromStr('people'),ColName.fromStr('id')))
);

const insert = new CmdDataInsert(
    0, 
    when, 
    TableName.fromStr('_users'),
    0, 
    new ColValue(ColName.fromStr('name'), new Utf81(), 'unknown')
);
const patch=new CmdDataPatch(
    0,
    when,
    TableName.fromStr('_users'),
    1,
    new ColValue(ColName.fromStr('name'), new Utf81(), 'default')
);
const del=new CmdDataDelete(
    0,
    when,
    TableName.fromStr('_users'),
    1
);
const insCols = new CmdCtrlInsCols(
	0,
	when,
	TableName.fromStr('_users'),
	ColName.fromStr('id'),
	new InsertColDef(ColName.fromStr('farts'), new Utf81(true),'yes'),
    new InsertColDef(ColName.fromStr('num'), new Int2(),3),
);
const remCols = new CmdCtrlRemCols(
    0, 
    when, 
    TableName.fromStr('_users'),
    ColName.fromStr('farts')
);
const drop = new CmdCtrlDrop(
    0, 
    when, 
    TableName.fromStr('_users'),
);

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
const cBin=create.toBin();
const insertBin=insert.toBin();
const patchBin=patch.toBin();
const delBin=del.toBin();
const icBin=insCols.toBin();
const rcBin=remCols.toBin();
const dBin=drop.toBin();
console.log(Hex.fromBytes(cBin));
console.log(Hex.fromBytes(insertBin));
console.log(Hex.fromBytes(patchBin));
console.log(Hex.fromBytes(delBin));
console.log(Hex.fromBytes(icBin));
console.log(Hex.fromBytes(rcBin));
console.log(Hex.fromBytes(dBin));

// From bin
console.log('---');
const createFrom=cmdFromBin(cBin);
console.log(JSON.stringify(createFrom.value));
const insColsFrom=cmdFromBin(icBin);
console.log(JSON.stringify(insColsFrom.value));
const remColsFrom=cmdFromBin(rcBin);
console.log(JSON.stringify(remColsFrom.value));
const dropFrom=cmdFromBin(dBin);
console.log(JSON.stringify(dropFrom.value));

console.log('----');
const insertFrom=cmdFromBin(insertBin);
console.log(JSON.stringify(insertFrom.value));
const patchFrom=cmdFromBin(patchBin);
console.log(JSON.stringify(patchFrom.value));
const delFrom=cmdFromBin(delBin);
console.log(JSON.stringify(delFrom.value));

tsts.run();
