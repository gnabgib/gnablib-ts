import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as utf8 from '../../src/encoding/Utf8';
import { Hex } from '../../src/encoding/Hex';
import {
	RipeMd160,
} from '../../src/hash/RipeMd';

const tsts = suite('RipeMd-160');

const ascii160HexPairs = [
	//Source: https://en.wikipedia.org/wiki/RIPEMD
	[
		'The quick brown fox jumps over the lazy dog',
		'37F332F68DB77BD9D7EDD4969571AD671CF9DD3B',
	],
	[
		'The quick brown fox jumps over the lazy cog',
		'132072DF690933835EB8B6AD0B77E7B6F14ACAD7',
	],
	//Source: https://homes.esat.kuleuven.be/~bosselae/ripemd160.html
	['', '9C1185A5C5E9FC54612808977EE8F548B2258D31'],
	['a', '0BDC9D2D256B3EE9DAAE347BE6F4DC835A467FFE'],
	['abc', '8EB208F7E05D987A9B044A8E98C6B087F15A0BFC'],
	['message digest', '5D0689EF49D2FAE572B881B123A85FFA21595F36'],
	['abcdefghijklmnopqrstuvwxyz', 'F71C27109C692C1B56BBDCEB5B9D2865B3708DBC'],
	[
		'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq',
		'12A053384A9C0C88E405A06C27DCF49ADA62EB2B',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
		'B0E20B6E3116640286ED3A87A5713079B21F5189',
	],
	['1234567890'.repeat(8), '9B752E45573D4B39F4DBD3323CAB82BF63326BFB'],
	//Other
	[
		'The quick brown fox jumps over the lazy dog.',
		'FC850169B1F2CE72E3F8AA0AEB5CA87D6F8519C6',
	], //Extra period
	['gnabgib', '324ABA4F089151BD019C8C747EF8F4BEC0447112'],
];

for (const [source,expect] of ascii160HexPairs) {
	const b = utf8.toBytes(source);
	tsts('RipeMd160:' + source, () => {
		const hash=new RipeMd160();
		hash.write(b);
		const md=hash.sum();
		assert.is(Hex.fromBytes(md), expect);
	});
}

tsts.run();
