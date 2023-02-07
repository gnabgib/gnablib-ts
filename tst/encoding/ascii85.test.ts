import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as ascii85 from '../../src/encoding/Ascii85';
import * as utf8 from '../../src/encoding/Utf8';

const tsts = suite('Ascii85');

const asciiSet = [
	//ASCII,    Enc
	['', ''],
	['Man ', '9jqo^'],
	['sure', 'F*2M7'],
	['\x00\x00\x00\x00', 'z'], // gets simplified to z
	['\x00\x00\x00\x00\x00\x00\x00\x00', 'zz'],
	//Failed on the original (size+8 impl because 12 bytes>3+8/11)
	['\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00', 'zzz'],
	['f', 'Ac'],
	['fo', 'Ao@'],
	['foo', 'AoDS'],
	['foob', 'AoDTs'],
	['fooba', 'AoDTs@/'],
	['foobar', 'AoDTs@<)'],
	['Hello', '87cURDZ'],
	[
		'Man is distinguished, not only by his reason, but by this singular passion from other animals, which is a lust of the mind, that by a perseverance of delight in the continued and indefatigable generation of knowledge, exceeds the short vehemence of any carnal pleasure.',
		//https://en.wikipedia.org/wiki/Ascii85#cite_note-1
		//Note this has different line wrapping from the wiki article (and the escapes for \ and ' make the lines look different lengths)
		'9jqo^BlbD-BleB1DJ+*+F(f,q/0JhKF<GL>Cj@.4Gp$d7F!,L7@<6@)/0JDEF<G%<+EV:2F!,O<DJ+*\r\n' +
			'.@<*K0@<6L(Df-\\0Ec5e;DffZ(EZee.Bl.9pF"AGXBPCsi+DGm>@3BB/F*&OCAfu2/AKYi(DIb:@FD,\r\n' +
			'*)+C]U=@3BN#EcYf8ATD3s@q?d$AftVqCh[NqF<G:8+EV:.+Cf>-FD5W8ARlolDIal(DId<j@<?3r@:\r\n' +
			"F%a+D58'ATD4$Bl@l3De:,-DJs`8ARoFb/0JMK@qB4^F!,R<AKZ&-DfTqBG%G>uD.RTpAKYo'+CT/5+\r\n" +
			'Cei#DII?(E,9)oF*2M7/c',
	],
];

for (const pair of asciiSet) {
	tsts('Encode:' + pair[0], () => {
		const u = utf8.toBytes(pair[0]);
		assert.is(ascii85.fromBytes(u), pair[1]);
	});

	tsts('Decode:' + pair[1], () => {
		const u = ascii85.toBytes(pair[1]);
		assert.is(utf8.fromBytes(u), pair[0]);
	});
}

tsts('Encode: hello the btoa way (with padding)', () => {
	const u = utf8.toBytes('Hello');
	assert.is(ascii85.fromBytes(u, { pad: true }), '87cURDZBb;');
});

//This doesn't work because btoa relies on length data in the xbtoa End line
// to determine if some of the data should be truncated (in this case there are
// extra \0 appended)
// tsts('Decode: btoa with padding',()=>{
//     const u = ascii85.toBytes('87cURDZBb;');
// 	assert.is(utf8.fromBytes(u), 'Hello');
// });

tsts.run();
