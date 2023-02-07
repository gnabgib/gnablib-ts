import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as utf8 from '../../src/encoding/Utf8';
import * as hex from '../../src/encoding/Hex';
import { shake128, shake256 } from '../../src/hash/Shake';

const tsts = suite('Shake');

const ascii128Tests = [
	//https://en.wikipedia.org/wiki/SHA-3
	[
		'',
		256 / 8,
		'7F9C2BA4E88F827D616045507605853ED73B8093F6EFBC88EB1A6EACFA66EF26',
	],
	[
		'The quick brown fox jumps over the lazy dog',
		256 / 8,
		'F4202E3C5852F9182A0430FD8144F0A74B95E7417ECAE17DB0F8CFEED0E3E66E',
	],
	[
		'The quick brown fox jumps over the lazy dof',
		256 / 8,
		'853F4538BE0DB9621A6CEA659A06C1107B1F83F02B13D18297BD39D7411CF10C',
	],
	//https://emn178.github.io/online-tools/shake_128.html
	[
		'The quick brown fox jumps over the lazy dog.',
		256 / 8,
		'634069E6B13C3AF64C57F05BABF5911B6ACF1D309B9624FC92B0C0BD9F27F538',
	],
	[
		'The quick brown fox jumps over the lazy cog',
		256 / 8,
		'22FD225FB8F2C8D0D2097E1F8D38B6A9E619D39664DAD3795F0336FDA544D305',
	],
	[
		'12345678901234567890123456789012345678901234567890123456789012345678901234567890',
		256 / 8,
		'7BF451C92FDC77B9771E6C9056445894EE867F00C2B70D3AF0D196A0CF6B28E1',
	],
	[
		'gnabgib',
		256 / 8,
		'48981809FE8A9E00E3743408D9F06EA70CE9271500B2A83D6CC67B05303B77D1',
	],
	//Notice shrinking digest size just truncates the result
	['gnabgib', 128 / 8, '48981809FE8A9E00E3743408D9F06EA7'],
	['gnabgib', 64 / 8, '48981809FE8A9E00'],
];
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

for (const test of ascii128Tests) {
	tsts('shake128:' + test[0] + ' @' + test[1], () => {
		const b = utf8.toBytes(test[0] as string);
		const m = shake128(b, test[1] as number);
		assert.is(hex.fromBytes(m), test[2] as string);
	});
}

for (const test of ascii256Tests) {
	tsts('shake256:' + test[0] + ' @' + test[1], () => {
		const b = utf8.toBytes(test[0] as string);
		const m = shake256(b, test[1] as number);
		assert.is(hex.fromBytes(m), test[2] as string);
	});
}

tsts.run();
