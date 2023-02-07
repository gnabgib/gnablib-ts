import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as proquint from '../../src/encoding/Proquint';
import * as ip from '../../src/net/Ip';
import * as intExt from '../../src/primitive/IntExt';

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

for (const pair of ipSet) {
	const i = ip.V4.fromString(pair[0]);
	tsts('Encode quad:' + pair[0], () => {
		assert.is(proquint.fromBytes(i.bytes), pair[1]);
	});

	tsts('Decode quad:' + pair[0], () => {
		assert.is(new ip.V4(proquint.toBytes(pair[1])).toString(), pair[0]);
	});
}

const bit16Set = [
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
for (const pair of bit16Set) {
	const ua = intExt.int16AsBytes(+pair[0]);
	tsts('Encode int16:' + pair[0], () => {
		assert.is(proquint.fromBytes(ua), pair[1]);
	});
	tsts('Decode int16:' + pair[0], () => {
		assert.is(intExt.int16fromBytes(proquint.toBytes(pair[1])), pair[0]);
	});
	//Decode
}

const numSet = [
	//'bdfghjklmnprstvz'
	[0xffffffff, 'zuzuz-zuzuz'], //From docs
	[12345678, 'bafus-kajav'], //From docs
];

for (const pair of numSet) {
	const ua = intExt.int32AsBytes(+pair[0]);
	tsts('Encode int32:' + pair[0], () => {
		assert.is(proquint.fromBytes(ua), pair[1]);
	});
	tsts('Decode int32:' + pair[0], () => {
		assert.is(intExt.uint32fromBytes(proquint.toBytes(pair[1])), pair[0]);
	});
}

//todo:undo
tsts.run();
