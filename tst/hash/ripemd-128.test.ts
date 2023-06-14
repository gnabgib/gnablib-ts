import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { utf8 } from '../../src/encoding/Utf8';
import { hex } from '../../src/encoding/Hex';
import {
	RipeMd128,
} from '../../src/hash/RipeMd';

const tsts = suite('RipeMd-128');

const ascii128HexPairs = [
	//Source: https://homes.esat.kuleuven.be/~bosselae/ripemd160.html
	['', 'CDF26213A150DC3ECB610F18F6B38B46'],
	['a', '86BE7AFA339D0FC7CFC785E72F578D33'],
	['abc', 'C14A12199C66E4BA84636B0F69144C77'],
	['message digest', '9E327B3D6E523062AFC1132D7DF9D1B8'],
	['abcdefghijklmnopqrstuvwxyz', 'FD2AA607F71DC8F510714922B371834E'],
	[
		'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq',
		'A1AA0689D0FAFA2DDC22E88B49133A06',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
		'D1E959EB179C911FAEA4624C60C5C702',
	],
	['1234567890'.repeat(8),'3F45EF194732C2DBB2C4A2C769795FA3'],

	//Other
	[
		'The quick brown fox jumps over the lazy dog',
		'3FA9B57F053C053FBE2735B2380DB596',
	],
	[
		'The quick brown fox jumps over the lazy cog',
		'3807AAAEC58FE336733FA55ED13259D9',
	],
	[
		'The quick brown fox jumps over the lazy dog.',
		'F39288A385E5996C6FB2C01F7F8FBF2F',
	],
	['gnabgib', '1B6B23F7CFBA4BBF4209757466C1561B'],
];

for (const [source,expect] of ascii128HexPairs) {
	const b = utf8.toBytes(source);
	tsts('RipeMd128:' + source, () => {
		const hash=new RipeMd128();
		hash.write(b);
		const md=hash.sum();
		assert.is(hex.fromBytes(md), expect);
	});
}

tsts.run();
