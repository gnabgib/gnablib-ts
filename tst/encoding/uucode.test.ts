import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as uucode from '../../src/encoding/Uucode';
import * as utf8 from '../../src/encoding/Utf8';
import { Hex } from '../../src/encoding/Hex';

const tsts = suite('Uucode');

//https://www.webutils.pl/index.php?idx=uu
const asciiSet = [
	['', '`\n'],
	['f', '!9@``\n`\n'],
	['fo', '"9F\\`\n`\n'],
	['foo', '#9F]O\n`\n'],
	['foob', '$9F]O8@``\n`\n'],
	['fooba', '%9F]O8F$`\n`\n'],
	['foobar', '&9F]O8F%R\n`\n'],
	['Cat', '#0V%T\n`\n'],
	[
		'http://www.wikipedia.org%0D%0A',
		">:'1T<#HO+W=W=RYW:6MI<&5D:6$N;W)G)3!$)3!!\n`\n",
	],
	[
		'http://www.wikipedia.org\r\n',
		"::'1T<#HO+W=W=RYW:6MI<&5D:6$N;W)G#0H`\n`\n",
	],
];

for (const pair of asciiSet) {
	tsts('Encode ascii:' + pair[0], () => {
		const bytes = utf8.toBytes(pair[0]);
		assert.is(uucode.fromBytes(bytes), pair[1]);
	});

	tsts('Decode ascii:' + pair[1], () => {
		const u = uucode.toBytes(pair[1]);
		assert.is(utf8.fromBytes(u), pair[0]);
	});
}

const hexSet = [
	[
		'00108310518720928B30D38F41149351559761969B71D79F8218A39259A7A29AABB2DBAFC31CB3D35DB7E39EBBF3DFBF',
		'M`!"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\n#\\]^_\n`\n',
	],
	[
		'FFEF7CEFAE78DF6D74CF2C70BEEB6CAEAA689E69648E28607DE75C6DA6585D65544D24503CE34C2CA2481C61440C2040',
		'M_^]\\[ZYXWVUTSRQPONMLKJIHGFEDCBA@?>=<;:9876543210/.-,+*)(\'&%$\n##"!`\n`\n',
	],
];

for (const pair of hexSet) {
	tsts('Encode hex:' + pair[0], () => {
		const bytes = Hex.toBytes(pair[0]);
		assert.is(uucode.fromBytes(bytes), pair[1]);
	});

	tsts('Decode hex:' + pair[1], () => {
		const u = uucode.toBytes(pair[1]);
		assert.is(Hex.fromBytes(u), pair[0]);
	});
}

tsts('Decode with spaces instead of backticks:', () => {
	const u = uucode.toBytes('!9@  \n`\n');
	assert.is(utf8.fromBytes(u), 'f');
});

tsts.run();
