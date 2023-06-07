import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import {
	ReedSolomon,
	qrCode,
	dataMatrix,
	aztecParam,
	aztecData6,
	aztecData8,
	aztecData10,
	aztecData12,
} from '../../src/ecc/ReedSolomon';
import * as utf8 from '../../src/encoding/Utf8';
import {Hex} from '../../src/encoding/Hex';

const tsts = suite('Reed-Solomon');

function assertArrayEq(arr1, arr2) {
	assert.is(arr1.length, arr2.length);
	for (let i = 0; i < arr1.length; i++) {
		assert.is(arr1[i], arr2[i]);
	}
}

function clear(arr: Uint8Array, start: number, end: number) {
	for (let i = start; i < end; i++) arr[i] = 0;
}

const rsQR = new ReedSolomon(qrCode());

const rsRecover = [
	//No interleaving
	['aaaabbbbccccddddeeeeffffgggg', 'aaaabbbbccc____deeeeffffgggg'], //4
	//Interleaving proof!
	['aaaabbbbccccddddeeeeffffgggg', 'aa_abbbbccccdddde_eef_ffg_gg'], //4
	['ThisIsAnExampleOfInterleaving', 'ThisIs______pleOfInterleaving'], //6
	['ThisIsAnExampleOfInterleaving...', 'T_isI_AnE_amp_eOfInterle_vin_...'], //6
];
for (const test of rsRecover) {
	//Recovery is based on the number of errors(*2) plus the field size..
	// while we're using i32, the field size is 256, so we need to consider by byte

	//We map u8 to i32, need to recover from up to 6 errors so need 12
	const ecLen = 12; //8 bytes or 2 i32
	const goodBytes = utf8.toBytes(test[0]);
	const badBytes = utf8.toBytes(test[1]);

	const msg = new Uint8Array(goodBytes.length + ecLen);

	tsts(`Recover ${test[0]}<-${test[1]}`, () => {
		//First we encode the original to get the ec
		msg.set(goodBytes, 0);
		rsQR.encode(msg, ecLen);

		//Now break the message
		msg.set(badBytes, 0);
		rsQR.decode(msg, ecLen);
		const orig = utf8.fromBytes(new Uint8Array(msg.slice(0, goodBytes.length)));
		assert.is(orig, test[0]);
	});
}

const encodeQrCodeAsciiHex = [
	//4 characters of ECC (can lose 2 in transmission)
	['gnabgib', '27C6199E'],
	['Wikipedia', 'AE4C3790'],
	['f', '383BDDB8'],
	['fo', '01197564'],
	['foo', '59E35E82'],
	['foob', '87608566'],
	['fooba', '8BBC6D3F'],
	['foobar', 'F23C75AC'],
	['foo bar baz٪☃🍣', '05077CDB'],
	['The quick brown fox jumps over the lazy dog', '0035A5DF'],
	['The quick brown fox jumps over the lazy cog', '8920BF5E'],
];
for (const test of encodeQrCodeAsciiHex) {
	const msg = utf8.toBytes(test[0]);
	const ecc = Hex.toBytes(test[1]);
	tsts('QrEncode ' + test[0], () => {
		const fullMsg = new Uint8Array(msg.length + ecc.length);
		fullMsg.set(msg);
		rsQR.encode(fullMsg, ecc.length);
		const genEcc = fullMsg.slice(msg.length);
		assert.equal(genEcc, ecc);
		assertArrayEq(genEcc, ecc);
	});
}

const encodeQrCode = [
	[
		[
			0x72, 0x67, 0x2f, 0x77, 0x69, 0x6b, 0x69, 0x2f, 0x4d, 0x61, 0x69, 0x6e,
			0x5f, 0x50, 0x61, 0x67, 0x65, 0x3b, 0x3b, 0x00, 0xec, 0x11, 0xec, 0x11,
			0xec, 0x11, 0xec, 0x11, 0xec, 0x11, 0xec, 0x11,
		],
		[
			0xd8, 0xb8, 0xef, 0x14, 0xec, 0xd0, 0xcc, 0x85, 0x73, 0x40, 0x0b, 0xb5,
			0x5a, 0xb8, 0x8b, 0x2e, 0x08, 0x62,
		],
	],
	[
		[
			0x10, 0x20, 0x0c, 0x56, 0x61, 0x80, 0xec, 0x11, 0xec, 0x11, 0xec, 0x11,
			0xec, 0x11, 0xec, 0x11,
		],
		[0xa5, 0x24, 0xd4, 0xc1, 0xed, 0x36, 0xc7, 0x87, 0x2c, 0x55],
	],
];

for (const test of encodeQrCode) {
	const msgLen = test[0].length;
	const ecLen = test[1].length;
	const fullLen = msgLen + ecLen;
	tsts('QrEncode', () => {
		const msg = new Uint8Array(fullLen);
		msg.set(test[0], 0);

		rsQR.encode(msg, ecLen);
		const ec = msg.slice(msgLen);
		assertArrayEq(ec, test[1]);
	});

	const dMsg = new Uint8Array(fullLen);
	//Can only recover from max half the number of ec values
	const maxErrors = ecLen >> 1;
	// So clearing the data (setting to zero) doesn't necessarily remove the value (it could have
	//  been zero).. but setting the start(msg)/end(ec)/middle(msg) proves it can recover
	tsts('QrDecode-start', () => {
		dMsg.set(test[0], 0);
		dMsg.set(test[1], msgLen);
		clear(dMsg, 0, maxErrors);
		rsQR.decode(dMsg, ecLen);

		const orig = dMsg.slice(0, msgLen);
		assertArrayEq(orig, test[0]);
	});
	tsts('QrDecode-end', () => {
		dMsg.set(test[0], 0);
		dMsg.set(test[1], msgLen);
		clear(dMsg, fullLen - maxErrors, fullLen);
		rsQR.decode(dMsg, ecLen);

		const orig = dMsg.slice(0, test[0].length);
		assertArrayEq(orig, test[0]);
	});
	tsts('QrDecode-mid', () => {
		dMsg.set(test[0], 0);
		dMsg.set(test[1], msgLen);
		const start = fullLen >> 2;
		clear(dMsg, start, start + maxErrors);
		rsQR.decode(dMsg, ecLen);

		const orig = dMsg.slice(0, test[0].length);
		assertArrayEq(orig, test[0]);
	});
}

const encodeDataMatrix = [
	[
		[
			0x69, 0x75, 0x75, 0x71, 0x3b, 0x30, 0x30, 0x64, 0x70, 0x65, 0x66, 0x2f,
			0x68, 0x70, 0x70, 0x68, 0x6d, 0x66, 0x2f, 0x64, 0x70, 0x6e, 0x30, 0x71,
			0x30, 0x7b, 0x79, 0x6a, 0x6f, 0x68, 0x30, 0x81, 0xf0, 0x88, 0x1f, 0xb5,
		],
		[
			0x1c, 0x64, 0xee, 0xeb, 0xd0, 0x1d, 0x00, 0x03, 0xf0, 0x1c, 0xf1, 0xd0,
			0x6d, 0x00, 0x98, 0xda, 0x80, 0x88, 0xbe, 0xff, 0xb7, 0xfa, 0xa9, 0x95,
		],
	],
	[
		[142, 164, 186],
		[114, 25, 5, 88, 102],
	],
];

const encDM = new ReedSolomon(dataMatrix());
for (const test of encodeDataMatrix) {
	tsts('DataMatrix', () => {
		const msg = new Uint8Array(test[0].length + test[1].length);
		msg.set(test[0], 0);
		encDM.encode(msg, test[1].length);
		const ec = msg.slice(test[0].length);
		assertArrayEq(ec, test[1]);
	});
}

const encodeAztecParam = [
	[
		[0x5, 0x6],
		[0x3, 0x2, 0xb, 0xb, 0x7],
	],
	[
		[0x0, 0x0, 0x0, 0x9],
		[0xa, 0xd, 0x8, 0x6, 0x5, 0x6],
	],
	[
		[0x2, 0x8, 0x8, 0x7],
		[0xe, 0xc, 0xa, 0x9, 0x6, 0x8],
	],
];

const encAP = new ReedSolomon(aztecParam());
for (const test of encodeAztecParam) {
	tsts('AztecParam', () => {
		const msg = new Uint8Array(test[0].length + test[1].length);
		msg.set(test[0], 0);
		encAP.encode(msg, test[1].length);
		const ec = msg.slice(test[0].length);
		assertArrayEq(ec, test[1]);
	});
}

const encodeAztec6 = [
	[
		[0x9, 0x32, 0x1, 0x29, 0x2f, 0x2, 0x27, 0x25, 0x1, 0x1b],
		[0x2c, 0x2, 0xd, 0xd, 0xa, 0x16, 0x28, 0x9, 0x22, 0xa, 0x14],
	],
];
const encA6 = new ReedSolomon(aztecData6());
for (const test of encodeAztec6) {
	tsts('AztecData6', () => {
		const msg = new Uint8Array(test[0].length + test[1].length);
		msg.set(test[0], 0);
		encA6.encode(msg, test[1].length);
		const ec = msg.slice(test[0].length);
		assertArrayEq(ec, test[1]);
	});
}

const encodeAztec8 = [
	[
		[
			0xe0, 0x86, 0x42, 0x98, 0xe8, 0x4a, 0x96, 0xc6, 0xb9, 0xf0, 0x8c, 0xa7,
			0x4a, 0xda, 0xf8, 0xce, 0xb7, 0xde, 0x88, 0x64, 0x29, 0x8e, 0x84, 0xa9,
			0x6c, 0x6b, 0x9f, 0x08, 0xca, 0x74, 0xad, 0xaf, 0x8c, 0xeb, 0x7c, 0x10,
			0xc8, 0x53, 0x1d, 0x09, 0x52, 0xd8, 0xd7, 0x3e, 0x11, 0x94, 0xe9, 0x5b,
			0x5f, 0x19, 0xd6, 0xfb, 0xd1, 0x0c, 0x85, 0x31, 0xd0, 0x95, 0x2d, 0x8d,
			0x73, 0xe1, 0x19, 0x4e, 0x95, 0xb5, 0xf1, 0x9d, 0x6f,
		],
		[
			0x31, 0xd7, 0x04, 0x46, 0xb2, 0xc1, 0x06, 0x94, 0x17, 0xe5, 0x0c, 0x2b,
			0xa3, 0x99, 0x15, 0x7f, 0x16, 0x3c, 0x66, 0xba, 0x33, 0xd9, 0xe8, 0x87,
			0x86, 0xbb, 0x4b, 0x15, 0x4e, 0x4a, 0xde, 0xd4, 0xed, 0xa1, 0xf8, 0x47,
			0x2a, 0x50, 0xa6, 0xbc, 0x53, 0x7d, 0x29, 0xfe, 0x06, 0x49, 0xf3, 0x73,
			0x9f, 0xc1, 0x75,
		],
	],
];
const encA8 = new ReedSolomon(aztecData8());
for (const test of encodeAztec8) {
	tsts('AztecData8', () => {
		const msg = new Uint8Array(test[0].length + test[1].length);
		msg.set(test[0], 0);
		encA8.encode(msg, test[1].length);
		const ec = msg.slice(test[0].length);
		assertArrayEq(ec, test[1]);
	});
}

const encodeAztec10 = [
	[
		[
			0x15c, 0x1e1, 0x2d5, 0x02e, 0x048, 0x1e2, 0x037, 0x0cd, 0x02e, 0x056,
			0x26a, 0x281, 0x1c2, 0x1a6, 0x296, 0x045, 0x041, 0x0aa, 0x095, 0x2ce,
			0x003, 0x38f, 0x2cd, 0x1a2, 0x036, 0x1ad, 0x04e, 0x090, 0x271, 0x0d3,
			0x02e, 0x0d5, 0x2d4, 0x032, 0x2ca, 0x281, 0x0aa, 0x04e, 0x024, 0x2d3,
			0x296, 0x281, 0x0e2, 0x08a, 0x1aa, 0x28a, 0x280, 0x07c, 0x286, 0x0a1,
			0x1d0, 0x1ad, 0x154, 0x032, 0x2c2, 0x1c1, 0x145, 0x02b, 0x2d4, 0x2b0,
			0x033, 0x2d5, 0x276, 0x1c1, 0x282, 0x10a, 0x2b5, 0x154, 0x003, 0x385,
			0x20f, 0x0c4, 0x02d, 0x050, 0x266, 0x0d5, 0x033, 0x2d5, 0x276, 0x1c1,
			0x0d4, 0x2a0, 0x08f, 0x0c4, 0x024, 0x20f, 0x2e2, 0x1ad, 0x154, 0x02e,
			0x056, 0x26a, 0x281, 0x090, 0x1e5, 0x14e, 0x0cf, 0x2b6, 0x1c1, 0x28a,
			0x2a1, 0x04e, 0x0d5, 0x003, 0x391, 0x122, 0x286, 0x1ad, 0x2d4, 0x028,
			0x262, 0x2ea, 0x0a2, 0x004, 0x176, 0x295, 0x201, 0x0d5, 0x024, 0x20f,
			0x116, 0x0c1, 0x056, 0x095, 0x213, 0x004, 0x1ea, 0x28a, 0x02a, 0x234,
			0x2ce, 0x037, 0x157, 0x0d3, 0x262, 0x026, 0x262, 0x2a0, 0x086, 0x106,
			0x2a1, 0x126, 0x1e5, 0x266, 0x26a, 0x2a1, 0x0e6, 0x1aa, 0x281, 0x2b6,
			0x271, 0x154, 0x02f, 0x0c4, 0x02d, 0x213, 0x0ce, 0x003, 0x38f, 0x2cd,
			0x1a2, 0x036, 0x1b5, 0x26a, 0x086, 0x280, 0x086, 0x1aa, 0x2a1, 0x226,
			0x1ad, 0x0cf, 0x2a6, 0x292, 0x2c6, 0x022, 0x1aa, 0x256, 0x0d5, 0x02d,
			0x050, 0x266, 0x0d5, 0x004, 0x176, 0x295, 0x201, 0x0d3, 0x055, 0x031,
			0x2cd, 0x2ea, 0x1e2, 0x261, 0x1ea, 0x28a, 0x004, 0x145, 0x026, 0x1a6,
			0x1c6, 0x1f5, 0x2ce, 0x034, 0x051, 0x146, 0x1e1, 0x0b0, 0x1b0, 0x261,
			0x0d5, 0x025, 0x142, 0x1c0, 0x07c, 0x0b0, 0x1e6, 0x081, 0x044, 0x02f,
			0x2cf, 0x081, 0x290, 0x0a2, 0x1a6, 0x281, 0x0cd, 0x155, 0x031, 0x1a2,
			0x086, 0x262, 0x2a1, 0x0cd, 0x0ca, 0x0e6, 0x1e5, 0x003, 0x394, 0x0c5,
			0x030, 0x26f, 0x053, 0x0c1, 0x1b6, 0x095, 0x2d4, 0x030, 0x26f, 0x053,
			0x0c0, 0x07c, 0x2e6, 0x295, 0x143, 0x2cd, 0x2ce, 0x037, 0x0c9, 0x144,
			0x2cd, 0x040, 0x08e, 0x054, 0x282, 0x022, 0x2a1, 0x229, 0x053, 0x0d5,
			0x262, 0x027, 0x26a, 0x1e8, 0x14d, 0x1a2, 0x004, 0x26a, 0x296, 0x281,
			0x176, 0x295, 0x201, 0x0e2, 0x2c4, 0x143, 0x2d4, 0x026, 0x262, 0x2a0,
			0x08f, 0x0c4, 0x031, 0x213, 0x2b5, 0x155, 0x213, 0x02f, 0x143, 0x121,
			0x2a6, 0x1ad, 0x2d4, 0x034, 0x0c5, 0x026, 0x295, 0x003, 0x396, 0x2a1,
			0x176, 0x295, 0x201, 0x0aa, 0x04e, 0x004, 0x1b0, 0x070, 0x275, 0x154,
			0x026, 0x2c1, 0x2b3, 0x154, 0x2aa, 0x256, 0x0c1, 0x044, 0x004, 0x23f,
		],
		[
			0x379, 0x099, 0x348, 0x010, 0x090, 0x196, 0x09c, 0x1ff, 0x1b0, 0x32d,
			0x244, 0x0de, 0x201, 0x386, 0x163, 0x11f, 0x39b, 0x344, 0x3fe, 0x02f,
			0x188, 0x113, 0x3d9, 0x102, 0x04a, 0x2e1, 0x1d1, 0x18e, 0x077, 0x262,
			0x241, 0x20d, 0x1b8, 0x11d, 0x0d0, 0x0a5, 0x29c, 0x24d, 0x3e7, 0x006,
			0x2d0, 0x1b7, 0x337, 0x178, 0x0f1, 0x1e0, 0x00b, 0x01e, 0x0da, 0x1c6,
			0x2d9, 0x00d, 0x28b, 0x34a, 0x252, 0x27a, 0x057, 0x0ca, 0x2c2, 0x2e4,
			0x3a6, 0x0e3, 0x22b, 0x307, 0x174, 0x292, 0x10c, 0x1ed, 0x2fd, 0x2d4,
			0x0a7, 0x051, 0x34f, 0x07a, 0x1d5, 0x01d, 0x22e, 0x2c2, 0x1df, 0x08f,
			0x105, 0x3fe, 0x286, 0x2a2, 0x3b1, 0x131, 0x285, 0x362, 0x315, 0x13c,
			0x0f9, 0x1a2, 0x28d, 0x246, 0x1b3, 0x12c, 0x2ad, 0x0f8, 0x222, 0x0ec,
			0x39f, 0x358, 0x014, 0x229, 0x0c8, 0x360, 0x1c2, 0x031, 0x098, 0x041,
			0x3e4, 0x046, 0x332, 0x318, 0x2e3, 0x24e, 0x3e2, 0x1e1, 0x0be, 0x239,
			0x306, 0x3a5, 0x352, 0x351, 0x275, 0x0ed, 0x045, 0x229, 0x0bf, 0x05d,
			0x253, 0x1be, 0x02e, 0x35a, 0x0e4, 0x2e9, 0x17a, 0x166, 0x03c, 0x007,
		],
	],
];
const encA10 = new ReedSolomon(aztecData10());
for (const test of encodeAztec10) {
	tsts('AztecData10', () => {
		const msg = new Uint16Array(test[0].length + test[1].length);
		msg.set(test[0], 0);
		encA10.encode(msg, test[1].length);
		const ec = msg.slice(test[0].length);
		assertArrayEq(ec, test[1]);
	});
}

const encodeAztec12 = [
	[
		[
			0x571, 0xe1b, 0x542, 0xe12, 0x1e2, 0x0dc, 0xcd0, 0xb85, 0x69a, 0xa81,
			0x709, 0xa6a, 0x584, 0x510, 0x4aa, 0x256, 0xce0, 0x0f8, 0xfb3, 0x5a2,
			0x0d9, 0xad1, 0x389, 0x09c, 0x4d3, 0x0b8, 0xd5b, 0x503, 0x2b2, 0xa81,
			0x2a8, 0x4e0, 0x92d, 0x3a5, 0xa81, 0x388, 0x8a6, 0xaa8, 0xaa0, 0x07c,
			0xa18, 0xa17, 0x41a, 0xd55, 0x032, 0xb09, 0xc15, 0x142, 0xbb5, 0x2b0,
			0x0ce, 0xd59, 0xd9c, 0x1a0, 0x90a, 0xad5, 0x540, 0x0f8, 0x583, 0xcc4,
			0x0b4, 0x509, 0x98d, 0x50c, 0xed5, 0x9d9, 0xc13, 0x52a, 0x023, 0xcc4,
			0x092, 0x0fb, 0x89a, 0xd55, 0x02e, 0x15a, 0x6aa, 0x049, 0x079, 0x54e,
			0x33e, 0xb67, 0x068, 0xaa8, 0x44e, 0x354, 0x03e, 0x452, 0x2a1, 0x9ad,
			0xb50, 0x289, 0x8ae, 0xa28, 0x804, 0x5da, 0x958, 0x04d, 0x509, 0x20f,
			0x458, 0xc11, 0x589, 0x584, 0xc04, 0x7aa, 0x8a0, 0xaa3, 0x4b3, 0x837,
			0x55c, 0xd39, 0x882, 0x698, 0xaa0, 0x219, 0x06a, 0x852, 0x679, 0x666,
			0x9aa, 0xa13, 0x99a, 0xaa0, 0x6b6, 0x9c5, 0x540, 0xbcc, 0x40b, 0x613,
			0x338, 0x03e, 0x3ec, 0xd68, 0x836, 0x6d6, 0x6a2, 0x1a8, 0x021, 0x9aa,
			0xa86, 0x266, 0xb4c, 0xfa9, 0xa92, 0xb18, 0x226, 0xaa5, 0x635, 0x42d,
			0x142, 0x663, 0x540, 0x45d, 0xa95, 0x804, 0xd31, 0x543, 0x1b3, 0x6ea,
			0x78a, 0x617, 0xaa8, 0xa01, 0x145, 0x099, 0xa67, 0x19f, 0x5b3, 0x834,
			0x145, 0x467, 0x84b, 0x06c, 0x261, 0x354, 0x255, 0x09c, 0x01f, 0x0b0,
			0x798, 0x811, 0x102, 0xfb3, 0xc81, 0xa40, 0xa26, 0x9a8, 0x133, 0x555,
			0x0c5, 0xa22, 0x1a6, 0x2a8, 0x4cd, 0x328, 0xe67, 0x940, 0x3e5, 0x0c5,
			0x0c2, 0x6f1, 0x4cc, 0x16d, 0x895, 0xb50, 0x309, 0xbc5, 0x330, 0x07c,
			0xb9a, 0x955, 0x0ec, 0xdb3, 0x837, 0x325, 0x44b, 0x344, 0x023, 0x854,
			0xa08, 0x22a, 0x862, 0x914, 0xcd5, 0x988, 0x279, 0xa9e, 0x853, 0x5a2,
			0x012, 0x6aa, 0x5a8, 0x15d, 0xa95, 0x804, 0xe2b, 0x114, 0x3b5, 0x026,
			0x98a, 0xa02, 0x3cc, 0x40c, 0x613, 0xad5, 0x558, 0x4c2, 0xf50, 0xd21,
			0xa99, 0xadb, 0x503, 0x431, 0x426, 0xa54, 0x03e, 0x5aa, 0x15d, 0xa95,
			0x804, 0xaa1, 0x380, 0x46c, 0x070, 0x9d5, 0x540, 0x9ac, 0x1ac, 0xd54,
			0xaaa, 0x563, 0x044, 0x401, 0x220, 0x9f1, 0x4f0, 0xdaa, 0x170, 0x90f,
			0x106, 0xe66, 0x85c, 0x2b4, 0xd54, 0x0b8, 0x4d3, 0x52c, 0x228, 0x825,
			0x512, 0xb67, 0x007, 0xc7d, 0x9ad, 0x106, 0xcd6, 0x89c, 0x484, 0xe26,
			0x985, 0xc6a, 0xda8, 0x195, 0x954, 0x095, 0x427, 0x049, 0x69d, 0x2d4,
			0x09c, 0x445, 0x355, 0x455, 0x003, 0xe50, 0xc50, 0xba0, 0xd6a, 0xa81,
			0x958, 0x4e0, 0xa8a, 0x15d, 0xa95, 0x806, 0x76a, 0xcec, 0xe0d, 0x048,
			0x556, 0xaaa, 0x007, 0xc2c, 0x1e6, 0x205, 0xa28, 0x4cc, 0x6a8, 0x676,
			0xace, 0xce0, 0x9a9, 0x501, 0x1e6, 0x204, 0x907, 0xdc4, 0xd6a, 0xa81,
			0x70a, 0xd35, 0x502, 0x483, 0xcaa, 0x719, 0xf5b, 0x383, 0x455, 0x422,
			0x71a, 0xa01, 0xf22, 0x915, 0x0cd, 0x6da, 0x814, 0x4c5, 0x751, 0x440,
			0x22e, 0xd4a, 0xc02, 0x6a8, 0x490, 0x7a2, 0xc60, 0x8ac, 0x4ac, 0x260,
			0x23d, 0x545, 0x055, 0x1a5, 0x9c1, 0xbaa, 0xe69, 0xcc4, 0x134, 0xc55,
			0x010, 0xc83, 0x542, 0x933, 0xcb3, 0x34d, 0x550, 0x9cc, 0xd55, 0x035,
			0xb4e, 0x2aa, 0x05e, 0x620, 0x5b0, 0x999, 0xc01, 0xf1f, 0x66b, 0x441,
			0xb36, 0xb35, 0x10d, 0x401, 0x0cd, 0x554, 0x313, 0x35a, 0x67d, 0x4d4,
			0x958, 0xc11, 0x355, 0x2b1, 0xaa1, 0x68a, 0x133, 0x1aa, 0x022, 0xed4,
			0xac0, 0x269, 0x8aa, 0x18d, 0x9b7, 0x53c, 0x530, 0xbd5, 0x450, 0x08a,
			0x284, 0xcd3, 0x38c, 0xfad, 0x9c1, 0xa0a, 0x2a3, 0x3c2, 0x583, 0x613,
			0x09a, 0xa12, 0xa84, 0xe00, 0xf85, 0x83c, 0xc40, 0x888, 0x17d, 0x9e4,
			0x0d2, 0x051, 0x34d, 0x409, 0x9aa, 0xa86, 0x2d1, 0x10d, 0x315, 0x426,
			0x699, 0x473, 0x3ca, 0x01f, 0x286, 0x286, 0x137, 0x8a6, 0x60b, 0x6c4,
			0xada, 0x818, 0x4de, 0x299, 0x803, 0xe5c, 0xd4a, 0xa87, 0x66d, 0x9c1,
			0xb99, 0x2a2, 0x59a, 0x201, 0x1c2, 0xa50, 0x411, 0x543, 0x148, 0xa66,
			0xacc, 0x413, 0xcd4, 0xf42, 0x9ad, 0x100, 0x935, 0x52d, 0x40a, 0xed4,
			0xac0, 0x271, 0x588, 0xa1d, 0xa81, 0x34c, 0x550, 0x11e, 0x620, 0x630,
			0x9d6, 0xaaa, 0xc26, 0x17a, 0x869, 0x0d4, 0xcd6, 0xda8, 0x1a1, 0x8a1,
			0x352, 0xa01, 0xf2d, 0x50a, 0xed4, 0xac0, 0x255, 0x09c, 0x023, 0x603,
			0x84e, 0xaaa, 0x04d, 0x60d, 0x66a, 0xa55, 0x52b, 0x182, 0x220, 0x091,
			0x00f, 0x8a7, 0x86d, 0x50b, 0x848, 0x788, 0x373, 0x342, 0xe15, 0xa6a,
			0xa05, 0xc26, 0x9a9, 0x611, 0x441, 0x2a8, 0x95b, 0x380, 0x3e3, 0xecd,
			0x688, 0x366, 0xb44, 0xe24, 0x271, 0x34c, 0x2e3, 0x56d, 0x40c, 0xaca,
			0xa04, 0xaa1, 0x382, 0x4b4, 0xe96, 0xa04, 0xe22, 0x29a, 0xaa2, 0xa80,
			0x1f2, 0x862, 0x85d, 0x06b, 0x554, 0x0ca, 0xc27, 0x054, 0x50a, 0xed4,
			0xac0, 0x33b, 0x567, 0x670, 0x682, 0x42a, 0xb55, 0x500, 0x3e1, 0x60f,
			0x310, 0x2d1, 0x426, 0x635, 0x433, 0xb56, 0x767, 0x04d, 0x4a8, 0x08f,
			0x310, 0x248, 0x3ee, 0x26b, 0x554, 0x0b8, 0x569, 0xaa8, 0x124, 0x1e5,
			0x538, 0xcfa, 0xd9c, 0x1a2, 0xaa1, 0x138, 0xd50, 0x0f9, 0x148, 0xa86,
			0x6b6, 0xd40, 0xa26, 0x2ba, 0x8a2, 0x011, 0x76a, 0x560, 0x135, 0x424,
			0x83d, 0x163, 0x045, 0x625, 0x613, 0x011, 0xeaa, 0x282, 0xa8d, 0x2ce,
			0x0dd, 0x573, 0x4e6, 0x209, 0xa62, 0xa80, 0x864, 0x1aa, 0x149, 0x9e5,
			0x99a, 0x6aa, 0x84e, 0x66a, 0xa81, 0xada, 0x715, 0x502, 0xf31, 0x02d,
			0x84c, 0xce0, 0x0f8, 0xfb3, 0x5a2, 0x0d9, 0xb59, 0xa88, 0x6a0, 0x086,
			0x6aa, 0xa18, 0x99a, 0xd33, 0xea6, 0xa4a, 0xc60, 0x89a, 0xa95, 0x8d5,
			0x0b4, 0x509, 0x98d, 0x501, 0x176, 0xa56, 0x013, 0x4c5, 0x50c, 0x6cd,
			0xba9, 0xe29, 0x85e, 0xaa2, 0x804, 0x514, 0x266, 0x99c, 0x67d, 0x6ce,
			0x0d0, 0x515, 0x19e, 0x12c, 0x1b0, 0x984, 0xd50, 0x954, 0x270, 0x07c,
			0x2c1, 0xe62, 0x044, 0x40b, 0xecf, 0x206, 0x902, 0x89a, 0x6a0, 0x4cd,
			0x554, 0x316, 0x888, 0x698, 0xaa1, 0x334, 0xca3, 0x99e, 0x500, 0xf94,
			0x314, 0x309, 0xbc5, 0x330, 0x5b6, 0x256, 0xd40, 0xc26, 0xf14, 0xcc0,
			0x1f2, 0xe6a, 0x554, 0x3b3, 0x6ce, 0x0dc, 0xc95, 0x12c, 0xd10, 0x08e,
			0x152, 0x820, 0x8aa, 0x18a, 0x453, 0x356, 0x620, 0x9e6, 0xa7a, 0x14d,
			0x688, 0x049, 0xaa9, 0x6a0, 0x576, 0xa56, 0x013, 0x8ac, 0x450, 0xed4,
			0x09a, 0x62a, 0x808, 0xf31, 0x031, 0x84e, 0xb55, 0x561, 0x30b, 0xd43,
			0x486, 0xa66, 0xb6d, 0x40d, 0x0c5, 0x09a, 0x950, 0x0f9, 0x6a8, 0x576,
			0xa56, 0x012, 0xa84, 0xe01, 0x1b0, 0x1c2, 0x755, 0x502, 0x6b0, 0x6b3,
			0x552, 0xaa9, 0x58c, 0x111, 0x004, 0x882, 0x7c5, 0x3c3, 0x6a8, 0x5c2,
			0x43c, 0x41b, 0x99a, 0x170, 0xad3, 0x550, 0x2e1, 0x34d, 0x4b0, 0x8a2,
			0x095, 0x44a, 0xd9c, 0x01f, 0x1f6, 0x6b4, 0x41b, 0x35a, 0x271, 0x213,
			0x89a, 0x617, 0x1ab, 0x6a0, 0x656, 0x550, 0x255, 0x09c, 0x125, 0xa74,
			0xb50, 0x271, 0x114, 0xd55, 0x154, 0x00f, 0x943, 0x142, 0xe83, 0x5aa,
			0xa06, 0x561, 0x382, 0xa28, 0x576, 0xa56, 0x019, 0xdab, 0x3b3, 0x834,
			0x121, 0x55a, 0xaa8, 0x01f, 0x0b0, 0x798, 0x816, 0x8a1, 0x331, 0xaa1,
			0x9da, 0xb3b, 0x382, 0x6a5, 0x404, 0x798, 0x812, 0x41f, 0x713, 0x5aa,
			0xa05, 0xc2b, 0x4d5, 0x409, 0x20f, 0x2a9, 0xc67, 0xd6c, 0xe0d, 0x155,
			0x089, 0xc6a, 0x807, 0xc8a, 0x454, 0x335, 0xb6a, 0x051, 0x315, 0xd45,
			0x100, 0x8bb, 0x52b, 0x009, 0xaa1, 0x241, 0xe8b, 0x182, 0x2b1, 0x2b0,
			0x980, 0x8f5, 0x514, 0x154, 0x696, 0x706, 0xeab, 0x9a7, 0x310, 0x4d3,
			0x154, 0x043, 0x20d, 0x50a, 0x4cf, 0x2cc, 0xd35, 0x542, 0x733, 0x554,
			0x0d6, 0xd38, 0xaa8, 0x179, 0x881, 0x6c2, 0x667, 0x007, 0xc7d, 0x9ad,
			0x106, 0xcda, 0xcd4, 0x435, 0x004, 0x335, 0x550, 0xc4c, 0xd69, 0x9f5,
			0x352, 0x563, 0x044, 0xd54, 0xac6, 0xa85, 0xa28, 0x4cc, 0x6a8, 0x08b,
			0xb52, 0xb00, 0x9a6, 0x2a8, 0x636, 0x6dd, 0x4f1, 0x4c2, 0xf55, 0x140,
			0x228, 0xa13, 0x34c, 0xe33, 0xeb6, 0x706, 0x828, 0xa8c, 0xf09, 0x60d,
			0x84c, 0x26a, 0x84a, 0xa13, 0x803, 0xe16, 0x0f3, 0x102, 0x220, 0x5f6,
			0x790, 0x348, 0x144, 0xd35, 0x026, 0x6aa, 0xa18, 0xb44, 0x434, 0xc55,
			0x099, 0xa65, 0x1cc, 0xf28, 0x07c, 0xa18, 0xa18, 0x4de, 0x299, 0x82d,
			0xb12, 0xb6a, 0x061, 0x378, 0xa66, 0x00f, 0x973, 0x52a, 0xa1d, 0x9b6,
			0x706, 0xe64, 0xa89, 0x668, 0x804, 0x70a, 0x941, 0x045, 0x50c, 0x522,
			0x99a, 0xb31, 0x04f, 0x353, 0xd0a, 0x6b4, 0x402, 0x4d5, 0x4b5, 0x02b,
			0xb52, 0xb00, 0x9c5, 0x622, 0x876, 0xa04, 0xd31, 0x540, 0x479, 0x881,
			0x8c2, 0x75a, 0xaab, 0x098, 0x5ea, 0x1a4, 0x353, 0x35b, 0x6a0, 0x686,
			0x284, 0xd4a, 0x807, 0xcb5, 0x42b, 0xb52, 0xb00, 0x954, 0x270, 0x08d,
			0x80e, 0x13a, 0xaa8, 0x135, 0x835, 0x9aa, 0x801, 0xf14, 0xf0d, 0xaa1,
			0x709, 0x0f1, 0x06e, 0x668, 0x5c2, 0xb4d, 0x540, 0xb84, 0xd35, 0x2c2,
			0x288, 0x255, 0x12b, 0x670, 0x07c, 0x7d9, 0xad1, 0x06c, 0xd68, 0x9c4,
			0x84e, 0x269, 0x85c, 0x6ad, 0xa81, 0x959, 0x540, 0x954, 0x270, 0x496,
			0x9d2, 0xd40, 0x9c4, 0x453, 0x554, 0x550, 0x03e, 0x50c, 0x50b, 0xa0d,
			0x6aa, 0x819, 0x584, 0xe0a, 0x8a1, 0x5da, 0x958, 0x067, 0x6ac, 0xece,
			0x0d0, 0x485, 0x56a, 0xaa0, 0x07c, 0x2c1, 0xe62, 0x05a, 0x284, 0xcc6,
			0xa86, 0x76a, 0xcec, 0xe09, 0xa95, 0x011, 0xe62, 0x049, 0x07d, 0xc4d,
			0x6aa, 0x817, 0x0ad, 0x355, 0x024, 0x83c, 0xaa7, 0x19f, 0x5b3, 0x834,
			0x554, 0x227, 0x1aa, 0x01f, 0x229, 0x150, 0xcd6, 0xda8, 0x144, 0xc57,
			0x514, 0x402, 0x2ed, 0x4ac, 0x026, 0xa84, 0x907, 0xa2c, 0x608, 0xac4,
			0xac2, 0x602, 0x3d5, 0x450, 0x551, 0xa59, 0xc1b, 0xaae, 0x69c, 0xc41,
			0x34c, 0x550, 0x10c, 0x835, 0x429, 0x33c, 0xb33, 0x4d5, 0x509, 0xccd,
			0x550, 0x35b, 0x4e2, 0xaa0, 0x5e6, 0x205, 0xb09, 0x99c, 0x09f,
		],
		[
			0xd54, 0x221, 0x154, 0x7cd, 0xbf3, 0x112, 0x89b, 0xc5e, 0x9cd, 0x07e,
			0xfb6, 0x78f, 0x7fa, 0x16f, 0x377, 0x4b4, 0x62d, 0x475, 0xbc2, 0x861,
			0xb72, 0x9d0, 0x76a, 0x5a1, 0x22a, 0xf74, 0xdba, 0x8b1, 0x139, 0xdcd,
			0x012, 0x293, 0x705, 0xa34, 0xdd5, 0x3d2, 0x7f8, 0x0a6, 0x89a, 0x346,
			0xce0, 0x690, 0x40e, 0xff3, 0xc4d, 0x97f, 0x9c9, 0x016, 0x73a, 0x923,
			0xbce, 0xfa9, 0xe6a, 0xb92, 0x02a, 0x07c, 0x04b, 0x8d5, 0x753, 0x42e,
			0x67e, 0x87c, 0xee6, 0xd7d, 0x2bf, 0xfb2, 0xff8, 0x42f, 0x4cb, 0x214,
			0x779, 0x02d, 0x606, 0xa02, 0x08a, 0xd4f, 0xb87, 0xddf, 0xc49, 0xb51,
			0x0e9, 0xf89, 0xaef, 0xc92, 0x383, 0x98d, 0x367, 0xbd3, 0xa55, 0x148,
			0x9db, 0x913, 0xc79, 0x6ff, 0x387, 0x6ea, 0x7fa, 0xc1b, 0x12d, 0x303,
			0xbca, 0x503, 0x0fb, 0xb14, 0x0d4, 0xad1, 0xafc, 0x9dd, 0x404, 0x145,
			0x6e5, 0x8ed, 0xf94, 0xd72, 0x645, 0xa21, 0x1a8, 0xabf, 0xc03, 0x91e,
			0xd53, 0x48c, 0x471, 0x4e4, 0x408, 0x33c, 0x5df, 0x73d, 0xa2a, 0x454,
			0xd77, 0xc48, 0x2f5, 0x96a, 0x9cf, 0x047, 0x611, 0xe92, 0xc2f, 0xa98,
			0x56d, 0x919, 0x615, 0x535, 0x67a, 0x8c1, 0x2e2, 0xbc4, 0xbe8, 0x328,
			0x04f, 0x257, 0x3f9, 0xfa5, 0x477, 0x12e, 0x94b, 0x116, 0xef7, 0x65f,
			0x6b3, 0x915, 0xc64, 0x9af, 0xb6c, 0x6a2, 0x50d, 0xea3, 0x26e, 0xc23,
			0x817, 0xa42, 0x71a, 0x9dd, 0xda8, 0x84d, 0x3f3, 0x85b, 0xb00, 0x1fc,
			0xb0a, 0xc2f, 0x00c, 0x095, 0xc58, 0x0e3, 0x807, 0x962, 0xc4b, 0x29a,
			0x6fc, 0x958, 0xd29, 0x59e, 0xb14, 0x95a, 0xede, 0xf3d, 0xfb8, 0x0e5,
			0x348, 0x2e7, 0x38e, 0x56a, 0x410, 0x3b1, 0x4b0, 0x793, 0xab7, 0x0bc,
			0x648, 0x719, 0xe3e, 0xfb4, 0x3b4, 0xe5c, 0x950, 0xd2a, 0x50b, 0x76f,
			0x8d2, 0x3c7, 0xecc, 0x87c, 0x53a, 0xba7, 0x4c3, 0x148, 0x437, 0x820,
			0xecd, 0x660, 0x095, 0x2f4, 0x661, 0x6a4, 0xb74, 0x5f3, 0x1d2, 0x7ec,
			0x8e2, 0xa40, 0xa6f, 0xfc3, 0x3be, 0x1e9, 0x52c, 0x233, 0x173, 0x4ef,
			0xa7c, 0x40b, 0x14c, 0x88d, 0xf30, 0x8d9, 0xbdb, 0x0a6, 0x940, 0xd46,
			0xb2b, 0x03e, 0x46a, 0x641, 0xf08, 0xaff, 0x496, 0x68a, 0x7a4, 0x0ba,
			0xd43, 0x515, 0xb26, 0xd8f, 0x05c, 0xd6e, 0xa2c, 0xf25, 0x628, 0x4e5,
			0x81d, 0xa2a, 0x1ff, 0x302, 0xfbd, 0x6d9, 0x711, 0xd8b, 0xe5c, 0x5cf,
			0x42e, 0x008, 0x863, 0xb6f, 0x1e1, 0x3da, 0xace, 0x82b, 0x2db, 0x7eb,
			0xc15, 0x79f, 0xa79, 0xdaf, 0x00d, 0x2f6, 0x0ce, 0x370, 0x7e8, 0x9e6,
			0x89f, 0xae9, 0x175, 0xa95, 0x06b, 0x9df, 0xaff, 0x45b, 0x823, 0xaa4,
			0xc79, 0x773, 0x886, 0x854, 0x0a5, 0x6d1, 0xe55, 0xebb, 0x518, 0xe50,
			0xf8f, 0x8cc, 0x834, 0x388, 0xcd2, 0xfc1, 0xa55, 0x1f8, 0xd1f, 0xe08,
			0xf93, 0x362, 0xa22, 0x9fa, 0xce5, 0x3c3, 0xdd4, 0xc53, 0xb94, 0xad0,
			0x6eb, 0x68d, 0x660, 0x8fc, 0xbcd, 0x914, 0x16f, 0x4c0, 0x134, 0xe1a,
			0x76f, 0x9cb, 0x660, 0xea0, 0x320, 0x15a, 0xce3, 0x7e8, 0x03e, 0xb9a,
			0xc90, 0xa14, 0x256, 0x1a8, 0x639, 0x7c6, 0xa59, 0xa65, 0x956, 0x9e4,
			0x592, 0x6a9, 0xcff, 0x4dc, 0xaa3, 0xd2a, 0xfde, 0xa87, 0xbf5, 0x9f0,
			0xc32, 0x94f, 0x675, 0x9a6, 0x369, 0x648, 0x289, 0x823, 0x498, 0x574,
			0x8d1, 0xa13, 0xd1a, 0xbb5, 0xa19, 0x7f7, 0x775, 0x138, 0x949, 0xa4c,
			0xe36, 0x126, 0xc85, 0xe05, 0xfee, 0x962, 0x36d, 0x08d, 0xc76, 0x1e1,
			0x1ec, 0x8d7, 0x231, 0xb68, 0x03c, 0x1de, 0x7df, 0x2b1, 0x09d, 0xc81,
			0xda4, 0x8f7, 0x6b9, 0x947, 0x9b0,
		],
	],
];
const encA12 = new ReedSolomon(aztecData12());

for (const test of encodeAztec12) {
	tsts('AztecData12', () => {
		const msg = new Uint16Array(test[0].length + test[1].length);
		msg.set(test[0], 0);
		encA12.encode(msg, test[1].length);

		const ec = msg.slice(test[0].length);
		assertArrayEq(ec, test[1]);
	});
}
tsts.run();
