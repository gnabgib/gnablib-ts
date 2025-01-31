import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex, proquint } from '../../src/codec';
import { IpV4 } from '../../src/primitive/net';
import { U16 } from '../../src/primitive/number';
import {U32} from '../../src/primitive/number/U32Static';
import { ByteWriter } from '../../src/primitive/ByteWriter';

const tsts = suite('Proquint');

const ipSet = [
	['127.0.0.1', 'lusab-babad'],
	['63.84.220.193', 'gutih-tugad'],
	['63.118.7.35', 'gutuk-bisog'],
	['140.98.193.141', 'mudof-sakat'],
	['64.255.6.200', 'haguz-biram'],
	['128.30.52.45', 'mabiv-gibot'],
	['147.67.119.2', 'natag-lisaf'],
	['212.58.253.68', 'tibup-zujah'],
	['216.35.68.215', 'tobog-higil'],
	['216.68.232.21', 'todah-vobij'],
	['198.81.129.136', 'sinid-makam'],
	['12.110.110.204', 'budov-kuras'],
];
//https://arxiv.org/html/0901.4016

for (const [ip,pq] of ipSet) {
	const i = IpV4.fromString(ip);
	tsts('Encode quad:' + ip, () => {
		assert.is(proquint.fromBytes(i.bytes), pq);
	});

	tsts(`toBytes(${pq})`, () => {
		assert.is(IpV4.fromBytes(proquint.toBytes(pq)).toString(), ip);
	});
}

const bit16Set:[number,string][] = [
	[0, 'babab'],
	[1, 'babad'],
	[2, 'babaf'],
	[3, 'babag'],
	[4, 'babah'],
	[5, 'babaj'],
	[6, 'babak'],
	[7, 'babal'],
	[8, 'babam'],
	[9, 'baban'],
	[10, 'babap'],
	[11, 'babar'],
	[12, 'babas'],
	[13, 'babat'],
	[14, 'babav'],
	[15, 'babaz'],
	[16, 'babib'],
	[32, 'babob'],
	[48, 'babub'],
	[100, 'badoh'],
	[10000, 'fisib'],
	[0xff, 'baguz'],
	[0xffff, 'zuzuz'],
];
const bytes2=new Uint8Array(2);
for (const [num,pro] of bit16Set) {
	tsts(`encode(${num})`, () => {
		const bw=ByteWriter.mount(bytes2);
		U16.intoBytesBE(num,bw);
		assert.is(proquint.fromBytes(bytes2), pro);
	});
	tsts(`decode(${pro})`, () => {
		assert.is(U16.fromBytesBE(proquint.toBytes(pro)),num)
	});
	//Decode
}

const fromBytes_tests:string[]=[
	'00'
];
for(const bHex of fromBytes_tests) {
	tsts(`decode(${bHex})`, () => {
		assert.throws(()=>proquint.fromBytes(hex.toBytes(bHex)));
	});
}

const numSet:[number,string][] = [
	//'bdfghjklmnprstvz'
	[0xffffffff, 'zuzuz-zuzuz'], //From docs
	[12345678, 'bafus-kajav'], //From docs
];

const bytes4=new Uint8Array(4);
for (const [num,pro] of numSet) {
	tsts('Encode int32:' + num, () => {
		const bw=ByteWriter.mount(bytes4);
		U32.intoBytesBE(num,bw);
		assert.is(proquint.fromBytes(bytes4), pro);
	});
	tsts('Decode int32:' + num, () => {
		assert.is(U32.fromBytesBE(proquint.toBytes(pro))>>>0, num);
	});
}

const bad_toBytes_tests:string[]=[
	'baba',
	'bab',
	'ba',
	'b',
	'c'
];
for(const test of bad_toBytes_tests) {
	tsts(`decode(${test}) throws`,()=>{
		assert.throws(()=>proquint.toBytes(test));
	});
}

tsts.run();
