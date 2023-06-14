import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { IpV4 } from '../../src/net/Ip';

const tsts = suite('IP/v4');

// prettier-ignore
const partsIntsStrings:[number[],number,string][] = [
	[[0, 0, 0, 0],          0,          '0.0.0.0'],
	[[0, 1, 2, 3],          66051,      '0.1.2.3'],
	[[0, 1, 2, 30],         66078,      '0.1.2.30'],
	[[1, 1, 2, 0],          16843264,   '1.1.2.0'],
	[[1, 1, 1, 1],          16843009,   '1.1.1.1'],
	[[1, 2, 3, 4],          16909060,   '1.2.3.4'],
	[[4, 3, 2, 1],          67305985,   '4.3.2.1'],
	[[8, 7, 6, 5],          134678021,  '8.7.6.5'],
	[[8, 8, 8, 8],          134744072,  '8.8.8.8'],
	[[100, 200, 150, 250],  1690867450, '100.200.150.250'],
	[[127, 0, 0, 1],        2130706433, '127.0.0.1'],
    [[127,255,255,255],     2147483647, '127.255.255.255'],//Max (signed) int32
	[[192, 168, 1, 1],      3232235777, '192.168.1.1'],
	[[255, 3, 2, 1],        4278387201, '255.3.2.1'],
	[[255, 255, 255, 255],  4294967295, '255.255.255.255']
];

for (const [parts,iVal,str] of partsIntsStrings) {

	tsts('Constructor: ' + str, () => {
		const ipAddr = new IpV4(new Uint8Array(parts));
		assert.is(ipAddr.toString(), str);
	});

	tsts('fromParts:' + str, () => {
		const ipAddr = IpV4.fromParts(parts[0],parts[1],parts[2],parts[3]);
		assert.is(ipAddr.toString(), str);
	});

	tsts('fromString:' + str, () => {
		const ipAddr = IpV4.fromString(str);
		assert.is(ipAddr.toString(), str);
	});

	tsts('fromInt:' + iVal, () => {
		const ipAddr = IpV4.fromInt(iVal);
		assert.is(ipAddr.toString(), str);
	});
	tsts('toInt: ' + str, () => {
		const ipAddr = new IpV4(new Uint8Array(parts));
		assert.is(ipAddr.toInt(), iVal);
	});
}

const badByteCount:number[][] = [
	//Too few
	[],
	[0],
	[0, 0],
	[0, 0, 0],
	//Too many
	[0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0],
];
for (const test of badByteCount) {
	tsts(`Building from ${test.length} bytes throws`, () => {
		assert.throws(() => new IpV4(Uint8Array.from(test)));
	});
}

const badParts:Array<number|undefined> = [-1, 256, 5000000, undefined];
for (const part of badParts) {
	tsts('Building from invalid part throws: ' + part, () => {
		assert.throws(() => IpV4.fromParts(part, 0, 0, 0));
	});

	//Constructor coerces to uint8 which truncates, so we cannot over/underflow
}

const badStringParse:string[] = [
	'0', //Not enough parts
	'0.0.0.0.0', //Too many parts
	'1.2.3.1000', //One part a bad size (>255)
	'hello', //Well.. that's not a number
	'...', //There are 4 parts, but empty strings aren't numbers
	'0x1.0x2.0x3.0x4', //Hex not allowed
	'0o1.0o2.0o3.0o4', //Oct not allowed
	'+1.1.1.1', //Sign not allowed
	'1.1.1.-1', //Sign not allowed
	'', //Not enough parts
];

for (const bad of badStringParse) {
	tsts('Parsing bad string throws: ' + bad, () => {
		assert.throws(() => IpV4.fromString(bad));
	});
}

const extStringParse:[string,string][] = [
	//Because parseInt allows spaces, spacey IPs are ok
	[' 0. 1 .2 .3', '0.1.2.3'],
	[' 0.1.2.3 ', '0.1.2.3'],
	['\t0.1.2.3 ', '0.1.2.3'],
	['0.1.2.3\r\n', '0.1.2.3'],
	//hex, oct isn't allowed in parseInt(x,10) - that's good
];
for (const [start,expect] of extStringParse) {
	tsts('Parsing extended string works: ' + start, () => {
		const ipAddr = IpV4.fromString(start);
		assert.is(ipAddr.toString(), expect);
	});
}

tsts.run();
