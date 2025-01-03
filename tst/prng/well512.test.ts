
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { well512 } from '../../src/prng/well512';
import { U512 } from '../../src/primitive/number';

const tsts = suite('well512');

//Sourced from well512.c https://github.com/Bill-Gray/prngs/blob/master/well512.c
const seq0: number[] = [
    0x295732ff, 0x479c6a8a, 0x331e895b, 0x4f8f1ca9, 0x33a9405a, 0x240d9004, 0x703cbf6f, 0x71aa84b5,
    0xb9be8a42, 0xe07d4269, 0x43c98c07, 0x97fae94e, 0x963fef44, 0xced6ebd0, 0x1fcd1ee1, 0x8bec1508,
    0xc8ced044, 0x312aab1f, 0xaaa46a34, 0xdb213327, 0x73f035b0, 0xc02c39d8, 0xfc0cc9ba, 0x4716020b,
    0x96e7270e, 0xf652bd19, 0xe0a505a9, 0xd266fa44, 0xe7cde7d0, 0x6c755150, 0x524a69b7, 0x2c2c3fb7,
    0x1c8a5b5b, 0x885561a7, 0x7830fa69, 0xec7cc104, 0xfa9bcc9c, 0x828f7341, 0x05d4881b, 0x31a7216e
];
const rng0=well512();
let i=0;
for (const expect of seq0) {
	const act = rng0();
	tsts(`well512()[${i}]`, () => {
        assert.equal(act,expect);
	});
	i++;
}

const seed1 = U512.fromUint32Hex(1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1);
const rng1=well512(seed1);
const seq1:number[]=[
    268435492,
    278135812
];
i=0;
for (const expect of seq1) {
	const act = rng1();
	tsts(`well512(seed1)[${i}]`, () => {
        assert.equal(act,expect);
	});
	i++;
}
tsts.run();
