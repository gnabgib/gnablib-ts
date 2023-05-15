import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as utf8 from '../../src/encoding/Utf8';
import * as hex from '../../src/encoding/Hex';
import { Keccak256 } from '../../src/hash/Keccak';

const tsts = suite('Keccak (256)');


const ascii256Pairs = [
	['', 'C5D2460186F7233C927E7DB2DCC703C0E500B653CA82273B7BFAD8045D85A470'],
	//https://emn178.github.io/online-tools/keccak_256.html
	[
		'The quick brown fox jumps over the lazy dog',
		'4D741B6F1EB29CB2A9B9911C82F56FA8D73B04959D3D9D222895DF6C0B28AA15',
	],
	[
		'The quick brown fox jumps over the lazy dog.',
		'578951E24EFD62A3D63A86F7CD19AAA53C898FE287D2552133220370240B572D',
	],
	[
		'The quick brown fox jumps over the lazy cog',
		'ED6C07F044D7573CC53BF1276F8CBA3DAC497919597A45B4599C8F73E22AA334',
	],
	[
		'12345678901234567890123456789012345678901234567890123456789012345678901234567890',
		'1523A0CD0E7E1FAABA17E1C12210FABC49FA99A7ABC061E3D6C978EEF4F748C4',
	],
	[
		'gnabgib',
		'62955A89E3AC49B4C86BC1A8A8B86A8C1AAB38F542528C50D8F1237F60944858',
	],
];

for (const [source,expect] of ascii256Pairs) {
	const b = utf8.toBytes(source);
	tsts('Keccak256:' + source, () => {
		const hash=new Keccak256();
		hash.write(b);
		const md=hash.sum();
		assert.is(hex.fromBytes(md), expect);
		assert.is(hash.size,32);
	});
}

tsts.run();
