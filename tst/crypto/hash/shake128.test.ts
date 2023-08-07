import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex, utf8 } from '../../../src/codec';
import { Shake128 } from '../../../src/crypto';


const tsts = suite('Shake (128)');

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

for (const [source,size,expect] of ascii128Tests) {
	const b = utf8.toBytes(source as string);
	tsts('Shake128:' + source + ' @' + size, () => {
		const hash=new Shake128(size as number);
		hash.write(b);
		const md=hash.sum();
		assert.is(hex.fromBytes(md), expect);
	});
}

tsts.run();
