
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { rc4_32 } from '../../src/prng/rc4';

const tsts = suite('rc4_32');

const key0=Uint8Array.of(1,2,3,4,5);
const seq0: number[] = [
    0x056339b2,
    0x27c03df0,
    0x4a52c3cc,
    0xa818110a,
    0x4f948269,
    0xd582fc18,
    0xa403c489, 
    0x19090d7a
];
const rng0=rc4_32(key0);
let i=0;
for (const expect of seq0) {
	const act = rng0();
	tsts(`rc4_32(key0)[${i}]`, () => {
        assert.equal(act,expect);
	});
	i++;
}

const key1=Uint8Array.of(1,2,3,4,5,6,7);
const seq1: number[] = [
    0xD4023F29,
    0xB6C9377F,
    0x52AFF233,
    0x6BB4FE85,
    0x39F120E6,
    0x84BD190D,
    0x75FDE0E2,
    0xC1AF3120
];
const rng1=rc4_32(key1);
i=0;
for (const expect of seq1) {
	const act = rng1();
	tsts(`rc4_32(key1)[${i}]`, () => {
        assert.equal(act,expect);
	});
	i++;
}

const key2=Uint8Array.of(0x83,0x32,0x22,0x77,0x2a);
const seq2: number[] = [
    0xBD97AD80,
    0x8ADF73C9,
    0x929E872E,
    0xDAEF97A4,
    0xC260F020,
    0x6512E5F2,
    0xFED4D301,
    0xC05F0DA1
];
const rng2=rc4_32(key2);
i=0;
for (const expect of seq2) {
	const act = rng2();
	tsts(`rc4_32(key2)[${i}]`, () => {
        assert.equal(act,expect);
	});
	i++;
}

tsts.run();
