import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex, utf8 } from '../../../src/codec';
import { Keccak384 } from '../../../src/crypto/hash';

const tsts = suite('Keccak (384)');

const ascii384Pairs = [
	//Source: https://en.wikipedia.org/wiki/SHA-2
	[
		'',
		'2C23146A63A29ACF99E73B88F8C24EAA7DC60AA771780CCC006AFBFA8FE2479B2DD2B21362337441AC12B515911957FF',
	],
	//!https://emn178.github.io/online-tools/keccak_384.html
	[
		'The quick brown fox jumps over the lazy dog',
		'283990FA9D5FB731D786C5BBEE94EA4DB4910F18C62C03D173FC0A5E494422E8A0B3DA7574DAE7FA0BAF005E504063B3',
	],
	[
		'The quick brown fox jumps over the lazy dog.',
		'9AD8E17325408EDDB6EDEE6147F13856AD819BB7532668B605A24A2D958F88BD5C169E56DC4B2F89FFD325F6006D820B',
	],
	[
		'The quick brown fox jumps over the lazy cog',
		'1CC515E1812491058D8B8B226FD85045E746B4937A58B0111B6B7A39DD431B6295BD6B6D05E01E225586B4DAB3CBB87A',
	],
	[
		'12345678901234567890123456789012345678901234567890123456789012345678901234567890',
		'FD6E89CBE3271545F94C3E6786803260F929C1589E3091AFD58CF32EF53A4F29B69C1166CB2982E2CB65CF5EB903E669',
	],
	[
		'gnabgib',
		'3552FA115C790DE606E9532C61522E73AAC6FD298F931D8445421EF8DC4173FA8F1F888E26BBED65F5AB5E01B633201F',
	],
];

for (const [source,expect] of ascii384Pairs) {
	const b = utf8.toBytes(source);
	tsts('Keccak384:' + source, () => {
		const hash=new Keccak384();
		hash.write(b);
		const md=hash.sum();
		assert.is(hex.fromBytes(md), expect);
		assert.is(hash.size,48);
	});
}

tsts.run();
