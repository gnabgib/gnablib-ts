import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as utf8 from '../../src/encoding/Utf8';
import * as hex from '../../src/encoding/Hex';
import {
	RipeMd256,
} from '../../src/hash/RipeMd';

const tsts = suite('RipeMd-256');

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

tsts.run();
