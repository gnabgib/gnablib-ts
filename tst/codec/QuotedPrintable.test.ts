import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex, quotedPrintable, utf8 } from '../../src/codec';

const tsts = suite('QuotedPrintable/RFC 2045');

const pairs = [
	// //norm,  enc
	['ab', 'ab'],
	['1+1=2', '1+1=3D2'],
	['A', 'A'],
	['À', '=C3=80'],
	['😊', '=F0=9F=98=8A'],
	[
		'0_________10________20________30________40________50________60________70________80________',
		'0_________10________20________30________40________50________60________70___=\r\n_____80________',
	],
	[
		'0_________10________20________30________40________50________60________70___=_____80________',
		'0_________10________20________30________40________50________60________70___=\r\n=3D_____80________',
	],
	[
		'0_________10________20________30________40________50________60________70__=______80________',
		'0_________10________20________30________40________50________60________70__=\r\n=3D______80________',
	],
	[
		'0_________10________20________30________40________50________60________70_=_______80________',
		'0_________10________20________30________40________50________60________70_=\r\n=3D_______80________',
	],
	[
		'0_________10________20________30________40________50________60________70=________80________',
		'0_________10________20________30________40________50________60________70=3D=\r\n________80________',
	],
	//Rule 6.7-3 (this is ok)
	[
		'0_________10________20________30________40________50________60________70__ _____80________',
		'0_________10________20________30________40________50________60________70__ =\r\n_____80________',
	],
	//Cannot end in a space
	[
		'0_________10________20________30________40________50________60________70_ \r\n_____80________',
		'0_________10________20________30________40________50________60________70_ =\r\n=0D=0A_____80________',
	],
	[
		'0_________10________20________30________40________50________60________70__ \r\n_____80________',
		'0_________10________20________30________40________50________60________70__ =\r\n=0D=0A_____80________',
	],
	//Rule 6.7-3 (this is ok)
	[
		'0_________10________20________30________40________50________60________70_\t_______80________',
		'0_________10________20________30________40________50________60________70_\t_=\r\n______80________',
	],
	[
		'0_________10________20________30________40________50________60________70__\t______80________',
		'0_________10________20________30________40________50________60________70__\t=\r\n______80________',
	],
	//
	[
		'                                                                                80________',
		'                                                                           =\r\n     80________',
	],
	['hello there', 'hello there'],
	['hello \r\nthere', 'hello =0D=0Athere'],
];

for (const pair of pairs) {
	tsts('fromBytes: ' + pair[0], () => {
		const b = utf8.toBytes(pair[0]);
		assert.is(quotedPrintable.fromBytes(b), pair[1]);
	});

	tsts('toBytes: ' + pair[1], () => {
		const b = quotedPrintable.toBytes(pair[1]);
		assert.is(utf8.fromBytes(b), pair[0]);
	});
}

//Quoted printable is problematic in that multiple encodings can represent the same decoding
const decodePairs = [
	[
		"Now's the time for all folk to come to the aid of their country.",
		"Now's the time =\r\nfor all folk to come=\r\n to the aid of their country.",
	],
	['One two three four', 'One=\r\n two =\r\nthre=\r\ne four'],
	//https://en.wikipedia.org/wiki/Quoted-printable
	[
		"J'interdis aux marchands de vanter trop leurs marchandises. Car ils se font vite pédagogues et t'enseignent comme but ce qui n'est par essence qu'un moyen, et te trompant ainsi sur la route à suivre les voilà bientôt qui te dégradent, car si leur musique est vulgaire ils te fabriquent pour te la vendre une âme vulgaire.\r\n— Antoine de Saint-Exupéry, Citadelle (1948)",
		"J'interdis aux marchands de vanter trop leurs marchandises. Car ils se font=\r\n vite p=C3=A9dagogues et t'enseignent comme but ce qui n'est par essence qu=\r\n'un moyen, et te trompant ainsi sur la route =C3=A0 suivre les voil=C3=\r\n=A0 bient=C3=B4t qui te d=C3=A9gradent, car si leur musique est vulgaire il=\r\ns te fabriquent pour te la vendre une =C3=A2me vulgaire.\r\n=E2=80=94=E2=80=89Antoine de Saint-Exup=C3=A9ry, Citadelle (1948)",
	],
];
for (const pair of decodePairs) {
	tsts('toBytes: ' + pair[1], () => {
		const b = quotedPrintable.toBytes(pair[1]);
		assert.is(utf8.fromBytes(b), pair[0]);
	});
}

const bad_fromBytes_lineLength_tests:[string,number][]=[
	['',1],
	['',1000],
];
for(const [qpHex,lineLen] of bad_fromBytes_lineLength_tests) {
	tsts(`fromBytes(${qpHex})`,()=>{
		assert.throws(()=>quotedPrintable.fromBytes(hex.toBytes(qpHex),{lineLength:lineLen}));
	});
}

const bad_toBytes_tests:string[]=[
	'=Q',
	'𣎴'
];
for(const bad of bad_toBytes_tests) {
	tsts(`toBytes(${bad})`,()=>{
		assert.throws(()=>quotedPrintable.toBytes(bad));
	})
}

tsts.run();
