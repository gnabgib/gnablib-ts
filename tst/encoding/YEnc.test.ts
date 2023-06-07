import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as yenc from '../../src/encoding/YEnc';
import * as utf8 from '../../src/encoding/Utf8';
import { Hex } from '../../src/encoding/Hex';

const tsts = suite('yEnc');

//Using: https://www.webutils.pl/index.php?idx=yenc
const pairs = [
	["I'm a test \r\nstring!", 'sQJJJ74K'],
	['Fast trains\t\r\n in spain \r\nstrain!', 'pJ374JJJ74K'],
	['0---------10--------', 'ZWWWWWWWWW[ZWWWWWWWW'],
	[
		'0---------10--------20--------30--------40--------50--------60--------70--------' +
			'80--------90--------100-------110-------120-------130-------140-------150-------',
		'ZWWWWWWWWW[ZWWWWWWWW\\ZWWWWWWWW]ZWWWWWWWW^ZWWWWWWWW_ZWWWWWWWW`ZWWWWWWWWaZWWWWWWWW' +
			'bZWWWWWWWWcZWWWWWWWW[ZZWWWWWWW[[ZWWWWWWW[\\ZWWWWW\r\nWW[]ZWWWWWWW[^ZWWWWWWW[_ZWWWWWWW',
	], //line wrap at 128
	[
		'A', //65 ascii
		'k',
	], //107 ascii = 65+42
	['😊', 'ÉÂ´'],
	//0x13 char is 42 away from =, which means it gets escaped into =}
	['\x13', '=}'],
	//ã is 42 away from CR, which means it escapes into =M, but UTF8 turns e3 into 2 bytes
	//['\xe3', '=M'],
];

for (const pair of pairs) {
	tsts('fromBytes: ' + pair[0], () => {
		const b = utf8.toBytes(pair[0]);
		assert.is(yenc.fromBytes(b), pair[1]);
	});

	tsts('toBytes: ' + pair[1], () => {
		const b = yenc.toBytes(pair[1]);
		assert.is(utf8.fromBytes(b), pair[0]);
	});
}

const hexPairs = [
	['00', '*'],
	['10', ':'],
	['20', 'J'],
	['30', 'Z'],
	['40', 'j'],
	['50', 'z'],
	['60', '\x8a'], //Line tabulation set https://unicode-table.com/en/008A/
	['70', '\x9a'], //Single character introducer https://unicode-table.com/en/009A/
	['80', 'ª'],
	['90', 'º'],
	['A0', 'Ê'],
	['B0', 'Ú'],
	['C0', 'ê'],
	['D0', 'ú'],
	['E0', '=J'], //\x0a = LF (10), so escape and +64
	['F0', '\x1a'], //Substitute https://unicode-table.com/en/001A/
	['FF', ')'],
	//Other escapes
	['D6', '=@'], //\x00 = null (0)
	['E3', '=M'], //\x0d = CR (13)
	['13', '=}'], //\x3D = = (61)
	//Special escapes - space (x20) or tab (x09)
	//f6+2a = 20
	['F6', '=`'], //Space at the start is escaped
	['00F6', '*=`'], //Space at the end is escaped
	['00F600', '* *'], //Space elsewhere isn't escaped
	//DF+2a = A
	['DF', '=I'], //Tab at start is escaped
	['00DF', '*=I'], //Tab at endis escaped
	['00DF00', '*\t*'], //Tab isn't escaped
];

for (const pair of hexPairs) {
	tsts('fromBytes: ' + pair[0], () => {
		const b = Hex.toBytes(pair[0]);
		assert.is(yenc.fromBytes(b), pair[1]);
	});

	tsts('toBytes: ' + pair[1], () => {
		const b = yenc.toBytes(pair[1]);
		assert.is(Hex.fromBytes(b), pair[0]);
	});
}

tsts.run();
