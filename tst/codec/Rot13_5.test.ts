import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { rot13_5, utf8 } from '../../src/codec';

const tsts = suite('ROT13.5');

const encodePairs = [
	//https://en.wikipedia.org/wiki/ROT13
	['hello world', 'uryyb jbeyq'],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
		'NOPQRSTUVWXYZABCDEFGHIJKLMnopqrstuvwxyzabcdefghijklm5678901234',
	],
	[
		'The Quick Brown Fox Jumps Over The Lazy Dog',
		'Gur Dhvpx Oebja Sbk Whzcf Bire Gur Ynml Qbt',
	],
	//Others
	['Hello 10', 'Uryyb 65'],
	['Password1234', 'Cnffjbeq6789'],
	['Hello there', 'Uryyb gurer'],
	['gnabgib', 'tanotvo'],
	['A≢Α.3', 'N≢Α.8'], //Second A is \u391 so not shifted
	['foobar', 'sbbone'],
	[
		'<?xml version="1.0" encoding="ISO-8859-1"?>',
		'<?kzy irefvba="6.5" rapbqvat="VFB-3304-6"?>',
	],
];

for (const pair of encodePairs) {
	tsts('Encode:' + pair[0], () => {
		const b = utf8.toBytes(pair[0]);
		const enc = rot13_5(b);
		const encUtf8 = utf8.fromBytes(enc);
		assert.is(encUtf8, pair[1]);
	});

	tsts('Decode:' + pair[1], () => {
		const b = utf8.toBytes(pair[1]);
		const enc = rot13_5(b);
		const decUtf8 = utf8.fromBytes(enc);
		assert.is(decUtf8, pair[0]);
	});
}

tsts.run();
