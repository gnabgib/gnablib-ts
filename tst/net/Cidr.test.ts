import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Cidr, IpV4 } from '../../src/net';

const tsts = suite('CIDR');

// prettier-ignore
const cidrs:[number[],number,string,string,boolean,string,number][] =[
    //Setup             start           end                 norm    toString            count
    [[10,10,10,10],24,  '10.10.10.0',   '10.10.10.255',     false,  '10.10.10.0/24',    256],
    [[10,10,10,0],24,   '10.10.10.0',   '10.10.10.255',     true,   '10.10.10.0/24',    256],
    [[10,10,10,255],24, '10.10.10.0',   '10.10.10.255',     false,  '10.10.10.0/24',    256],
    [[10,10,10,255],32, '10.10.10.255', '10.10.10.255',     true,   '10.10.10.255/32',  1],
    [[192,168,1,1],16,  '192.168.0.0',  '192.168.255.255',  false,  '192.168.0.0/16',   65536],
    [[0,0,0,0],0,       '0.0.0.0',      '255.255.255.255',  true,   '0.0.0.0/0',        4294967296],//Whole internet!
    [[128,0,0,0],1,     '128.0.0.0',    '255.255.255.255',  true,  '128.0.0.0/1',      2147483648],//Half internet!
    [[128,0,0,0],32,    '128.0.0.0',    '128.0.0.0',        true,  '128.0.0.0/32',     1],
    [[128,0,0,1],32,    '128.0.0.1',    '128.0.0.1',        true,  '128.0.0.1/32',     1],
    [[128,0,0,0],31,    '128.0.0.0',    '128.0.0.1',        true,  '128.0.0.0/31',     2],
]

for (const [ip, mask, start, end, normal, str, count] of cidrs) {
	const ipAddr = new IpV4(Uint8Array.from(ip));
	const cidr = new Cidr(ipAddr, mask);

	tsts('Mask ' + str, () => {
		assert.is(cidr.mask, mask);
	});

	tsts('StartIp for ' + str, () => {
		assert.is(cidr.startIp.toString(), start);
	});

	tsts('EndIp for ' + str, () => {
		assert.is(cidr.endIp.toString(), end);
	});

	tsts('normalForm ' + str, () => {
		assert.equal(cidr.normalForm, normal);
	});

	tsts('ToString for ' + str, () => {
		assert.is(cidr.toString(), str);
	});

	tsts('Count for ' + str, () => {
		assert.is(cidr.count, count);
	});

	tsts('fromString ' + str, () => {
		const cidrStr = Cidr.fromString(str);
		assert.equal(cidrStr.toString(), str);
	});
}

const badParse: string[] = [
	'1.1.1.1/33', //Bad mask
	'1000.1.1.1/24', //Bad IP (quad part)
	'1.1.1/24', //Bad IP (quad count)
	'1.1.1.1/0x10', //Bad mask (hex not allowed)
	'1.1.1.1/+12', //Sign not allowed
	'1.1.1.1/-1', //Sign not allowed
	'', //Not enough parts
];

for (const test of badParse) {
	tsts('fromString throws with ' + test, () => {
		assert.throws(() => Cidr.fromString(test));
	});
}

const otherParse: [string, string][] = [
	['10.10.10.0 /24', '10.10.10.0/24'], //Space ignored
	['10.10.10.0/\t24', '10.10.10.0/24'], //Space ignored
	['\t10.10.10.0/\t24\t', '10.10.10.0/24'], //Space ignored
	['10.10.10.10/24', '10.10.10.0/24'], //Normalized after parse
];

for (const [start, expect] of otherParse) {
	tsts('fromString ' + start, () => {
		const c = Cidr.fromString(start);
		assert.is(c.toString(), expect);
	});
}

const equals = [
	['10.10.10.0/24', '10.10.10.0/24', true],
	['10.10.10.10/24', '10.10.10.0/24', true], //Only normal form
	['10.10.10.0/24', '10.10.10.0/25', false], //Wrong mask
	['10.10.10.0/24', '10.10.10.0/23', false], //Wrong mask
	['10.10.10.0/24', '10.10.11.0/24', false], //Wrong start IP
	['10.10.10.0/24', '11.11.11.0/24', false], //Wrong start IP
];
for (const test of equals) {
	const a = Cidr.fromString(test[0] as string);
	const b = Cidr.fromString(test[1] as string);
	tsts(`${test[0]}===${test[1]}`, () => {
		assert.equal(a.equals(b), test[2]);
	});
}

//10.10.10.0/24 contains:
const contains: [string, boolean][] = [
	['10.10.10.0', true],
	['10.10.10.255', true],
	['10.10.11.0', false],
	['10.10.9.255', false],
	['0.0.0.0', false],
];
const c = new Cidr(IpV4.fromParts(10, 10, 10, 0), 24);
for (const [start, expect] of contains) {
	const ipv4 = IpV4.fromString(start);
	tsts(`10.10.10.0/24 contains ${start}`, () => {
		assert.equal(c.containsIp(ipv4), expect);
	});
}

tsts.run();
