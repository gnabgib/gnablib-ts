import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as utf8 from '../../src/encoding/Utf8';
import { Hex } from '../../src/encoding/Hex';
import {  Shake256 } from '../../src/hash/Shake';

const tsts = suite('Shake (256)');

const ascii256Tests = [
	//https://en.wikipedia.org/wiki/SHA-3
	[
		'',
		512 / 8,
		'46B9DD2B0BA88D13233B3FEB743EEB243FCD52EA62B81B82B50C27646ED5762FD75DC4DDD8C0F200CB05019D67B592F6FC821C49479AB48640292EACB3B7C4BE',
	],
	//https://emn178.github.io/online-tools/shake_256.html
	[
		'The quick brown fox jumps over the lazy dog',
		512 / 8,
		'2F671343D9B2E1604DC9DCF0753E5FE15C7C64A0D283CBBF722D411A0E36F6CA1D01D1369A23539CD80F7C054B6E5DAF9C962CAD5B8ED5BD11998B40D5734442',
	],
	[
		'The quick brown fox jumps over the lazy dog.',
		512 / 8,
		'BD225BFC8B255F3036F0C8866010ED0053B5163A3CAE111E723C0C8E704ECA4E5D0F1E2A2FA18C8A219DE6B88D5917FF5DD75B5FB345E7409A3B333B508A65FB',
	],
	[
		'The quick brown fox jumps over the lazy cog',
		512 / 8,
		'FFFCAAC0606C0EDB7BC0D15F033ACCB68538159016E5AE8470BF9EBEA89FA6C9FCC3E027D94F7F967B7246346BD9F6B8084E45A057B976847C4DB03BF383C834',
	],
	[
		'12345678901234567890123456789012345678901234567890123456789012345678901234567890',
		512 / 8,
		'24C508ADEFDF5E3F2596E8B5A888FE10EB7B5B22E1F35D858E6EFF3025C4CC18A3C9ACE51DDD243D08C8C70CF68E91D170603DC3E2A31C6CA89F20C4A595A265',
	],
	[
		'gnabgib',
		512 / 8,
		'AB834584BC411345E113CB06C271BEA547FF4A080B926653051FF20BA45E0DD4F1738C973F8B1B32CE49AFAABF4A2DA6AE07042A146E4253D8CE0A92C85C1BED',
	],
	[
		'gnabgib',
		256 / 8,
		'AB834584BC411345E113CB06C271BEA547FF4A080B926653051FF20BA45E0DD4',
	],
	['gnabgib', 128 / 8, 'AB834584BC411345E113CB06C271BEA5'],
	['gnabgib', 64 / 8, 'AB834584BC411345'],
];

for (const [source,size,expect] of ascii256Tests) {
    const b = utf8.toBytes(source as string);
    tsts('Shake256:' + source + ' @' + size, () => {
		const hash=new Shake256(size as number);
		hash.write(b);
		const md=hash.sum();
		assert.is(Hex.fromBytes(md), expect);
	});
}

tsts.run();
