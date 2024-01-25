import { suite } from 'uvu';
import * as assert from 'uvu/assert'
import { rot47, utf8 } from '../../src/codec';

//https://www.boxentriq.com/code-breaking/rot13 (13+13.5+47)

const tsts = suite('ROT47');

const encodePairs = [
	//https://en.wikipedia.org/wiki/ROT13
	['+1-415-839-6885', 'Z`\\c`d\\gbh\\eggd'], //Wiki is wrong
	[
		'The Quick Brown Fox Jumps Over The Lazy Dog.',
		'%96 "F:4< qC@H? u@I yF>AD ~G6C %96 {2KJ s@8]',
	],
	//Others
	['hello world', '96==@ H@C=5'],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
		'pqrstuvwxyz{|}~!"#$%&\'()*+23456789:;<=>?@ABCDEFGHIJK_`abcdefgh',
	],
	['Hello 10', 'w6==@ `_'],
	['Password1234', '!2DDH@C5`abc'],
	['Hello there', 'w6==@ E96C6'],
	['gnabgib', '8?238:3'],
	['A≢Α.3', 'p≢Α]b'], //Second A is \u391 so not shifted
	['foobar', '7@@32C'],
	[
		'<?xml version="1.0" encoding="ISO-8859-1"?>',
		'knI>= G6CD:@?lQ`]_Q 6?4@5:?8lQx$~\\ggdh\\`Qnm',
	],
];

for (const pair of encodePairs) {
	tsts('Encode:' + pair[0], () => {
		const b = utf8.toBytes(pair[0]);
		const enc = rot47(b);
		const encUtf8 = utf8.fromBytes(enc);
		assert.is(encUtf8, pair[1]);
	});

	tsts('Decode:' + pair[1], () => {
		const b = utf8.toBytes(pair[1]);
		const enc = rot47(b);
		const decUtf8 = utf8.fromBytes(enc);
		assert.is(decUtf8, pair[0]);
	});
}

tsts.run();
