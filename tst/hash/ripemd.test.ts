import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as utf8 from '../../src/encoding/Utf8';
import * as hex from '../../src/encoding/Hex';
import {
	RipeMd128,
	RipeMd160,
	RipeMd256,
	RipeMd320,
} from '../../src/hash/RipeMd';

const tsts = suite('RipeMd');

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
	//['1234567890'.repeat(8),'3F45EF194732C2DBB2C4A2C769795FA3'],

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
		assert.is(hex.fromBytes(md), expect);
	});
}

const ascii256HexPairs = [
	//Source: https://homes.esat.kuleuven.be/~bosselae/ripemd160.html
	['', '02BA4C4E5F8ECD1877FC52D64D30E37A2D9774FB1E5D026380AE0168E3C5522D'],
	['a', 'F9333E45D857F5D90A91BAB70A1EBA0CFB1BE4B0783C9ACFCD883A9134692925'],
	['abc', 'AFBD6E228B9D8CBBCEF5CA2D03E6DBA10AC0BC7DCBE4680E1E42D2E975459B65'],
	[
		'message digest',
		'87E971759A1CE47A514D5C914C392C9018C7C46BC14465554AFCDF54A5070C0E',
	],
	[
		'abcdefghijklmnopqrstuvwxyz',
		'649D3034751EA216776BF9A18ACC81BC7896118A5197968782DD1FD97D8D5133',
	],
	[
		'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq',
		'3843045583AAC6C8C8D9128573E7A9809AFB2A0F34CCC36EA9E72F16F6368E3F',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
		'5740A408AC16B720B84424AE931CBB1FE363D1D0BF4017F1A89F7EA6DE77A0B8',
	],
	[
		'1234567890'.repeat(8),
		'06FDCC7A409548AAF91368C06A6275B553E3F099BF0EA4EDFD6778DF89A890DD',
	],
	// //Other using online calc @ https://md5calc.com/hash/ripemd256/
	[
		'The quick brown fox jumps over the lazy dog',
		'C3B0C2F764AC6D576A6C430FB61A6F2255B4FA833E094B1BA8C1E29B6353036F',
	],
	[
		'The quick brown fox jumps over the lazy cog',
		'B44055D843DEA5BCD2151E52B1A0DBC5E8E34493E5FE2F000C0E71F73C3DDCAE',
	],
	[
		'The quick brown fox jumps over the lazy dog.',
		'379E373D9E1B6E71712B8F4A19B8FB125CAA3F4CE92A258EB764D721D9A08BAD',
	], //Extra period
	[
		'gnabgib',
		'0FE057F4F9AF9B0D4BB09B5FAE73BBE630D2FFB3D7B8614C9AC441A7D03EDEE7',
	],
];

for (const [source,expect] of ascii256HexPairs) {
	const b = utf8.toBytes(source);
	tsts('RipeMd256:' + source, () => {
		const hash=new RipeMd256();
		hash.write(b);
		const md=hash.sum();
		assert.is(hex.fromBytes(md), expect);
	});
}

const ascii320HexPairs = [
	//Source: https://homes.esat.kuleuven.be/~bosselae/ripemd160.html
	[
		'',
		'22D65D5661536CDC75C1FDF5C6DE7B41B9F27325EBC61E8557177D705A0EC880151C3A32A00899B8',
	],
	[
		'a',
		'CE78850638F92658A5A585097579926DDA667A5716562CFCF6FBE77F63542F99B04705D6970DFF5D',
	],
	[
		'abc',
		'DE4C01B3054F8930A79D09AE738E92301E5A17085BEFFDC1B8D116713E74F82FA942D64CDBC4682D',
	],
	[
		'message digest',
		'3A8E28502ED45D422F68844F9DD316E7B98533FA3F2A91D29F84D425C88D6B4EFF727DF66A7C0197',
	],
	[
		'abcdefghijklmnopqrstuvwxyz',
		'CABDB1810B92470A2093AA6BCE05952C28348CF43FF60841975166BB40ED234004B8824463E6B009',
	],
	[
		'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq',
		'D034A7950CF722021BA4B84DF769A5DE2060E259DF4C9BB4A4268C0E935BBC7470A969C9D072A1AC',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
		'ED544940C86D67F250D232C30B7B3E5770E0C60C8CB9A4CAFE3B11388AF9920E1B99230B843C86A4',
	],
	[
		'1234567890'.repeat(8),
		'557888AF5F6D8ED62AB66945C6D2A0A47ECD5341E915EB8FEA1D0524955F825DC717E4A008AB2D42',
	],
	// //Other using online calc @ https://md5calc.com/hash/ripemd256/
	[
		'The quick brown fox jumps over the lazy dog',
		'E7660E67549435C62141E51C9AB1DCC3B1EE9F65C0B3E561AE8F58C5DBA3D21997781CD1CC6FBC34',
	],
	[
		'The quick brown fox jumps over the lazy cog',
		'393E0DF728C4CE3D79E7DCFD357D5C26F5C6D64C6D652DC53B6547B214EA9183E4F61C477EBF5CB0',
	],
	[
		'The quick brown fox jumps over the lazy dog.',
		'4B743C0A2262F904097FDA33F0B8E03819BC012C5FC39643F17049C566EEE0B1961D1BD7B25A3E4D',
	], //Extra period
	[
		'gnabgib',
		'EFB9A476DAC2762191AA9890089ECCE637DAA14C22A2F8B6D024DF1AAB2DDDFAE159071D96196EFF',
	],
];
for (const [source,expect] of ascii320HexPairs) {
	const b = utf8.toBytes(source);
	tsts('RipeMd320:' + source, () => {
		const hash=new RipeMd320();
		hash.write(b);
		const md=hash.sum();
		assert.is(hex.fromBytes(md), expect);
	});
}

tsts.run();
