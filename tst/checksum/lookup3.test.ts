import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Lookup3 } from '../../src/checksum/Lookup3';
import { hex, utf8 } from '../../src/codec';

const tsts = suite('Lookup3');

const sum_abcd: [number, number] = [3052701852, 3792557050];
const sum_abcdefgh: [number, number] = [697680830, 3348534564];

const string_tests: [string, [number, number]][] = [
	['a', [1490454280, 1478903724]],
	['ab', [4222855391, 1803133170]],
	['abc', [238646833, 1006878366]],
	['abcd', sum_abcd],
	['abcdefgh', sum_abcdefgh],
	['hello', [885767278, 1543812985]],
	['hello, world', [1503810069, 3227379029]], //Exactly 12 bytes (more than one hash)
	['hello, world!', [2262714993, 1089227105]],
	['My hovercraft is full of eels.', [3977741523, 4239081275]], //More than one hash
	['message digest', [2512672053, 1044030308]],
];
for (const [src, expect] of string_tests) {
	tsts(`Lookup3(${src}).sum32pair()`, () => {
		const hash = new Lookup3();
		hash.write(utf8.toBytes(src));
		const md = hash.sum32pair();
		assert.equal(md, expect);
	});
	tsts(`Lookup3(${src}).sum32()`, () => {
		const hash = new Lookup3();
		hash.write(utf8.toBytes(src));
		const md = hash.sum32();
		//sum32 just returns the first number of sum32pair
		assert.equal(md, expect[0]);
	});
}

const byte_tests: [Uint8Array, [number, number]][] = [
	[new Uint8Array(), [3735928559, 3735928559]],
	[new Uint8Array(1), [2343125323, 1431942852]],
	[new Uint8Array(2), [1657627059, 301789417]],
	[new Uint8Array(3), [1808795151, 1150068427]],
	[new Uint8Array(4), [76781240, 2941345047]],
	[Uint8Array.of(1), [82610235, 2126733405]],
];
for (const [bytes, expect] of byte_tests) {
	tsts(`Lookup3([${bytes.length}]).sum32pair()`, () => {
		const hash = new Lookup3();
		hash.write(bytes);
		const md = hash.sum32pair();
		assert.equal(md, expect);
	});
}

const byte_seed_tests: [Uint8Array, [number, number], [number, number]][] = [
	[new Uint8Array(), [0, 0], [3735928559, 3735928559]], //Dupe from above, just to show
	[new Uint8Array(), [1, 0], [3735928560, 3735928560]],
	[new Uint8Array(), [0, 1], [3735928560, 3735928559]],
];
for (const [data, seed, expect] of byte_seed_tests) {
	tsts(`Lookup3([0],${seed}).sum32Pair()`, () => {
		const hash = new Lookup3(...seed);
		hash.write(data);
		const md = hash.sum32pair();
		assert.equal(md, expect);
	});
}

tsts(`sum()`, () => {
	const hash = new Lookup3(0);
	hash.write(Uint8Array.of(0));
	const sum = hash.sum();
	assert.is(sum.length, hash.size);
	assert.is(hash.blockSize > 0, true);
	assert.is(hex.fromBytes(sum), 'C4B659554B41A98B');
});

tsts(`write twice throws`, () => {
	const hash = new Lookup3(1);
	hash.write(Uint8Array.of(1, 2, 3));
	assert.throws(() => hash.write(Uint8Array.of(4)));
});

tsts.run();
