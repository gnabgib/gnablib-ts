
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { rc4_64 } from '../../src/prng/rc4';

const tsts = suite('rc4_64');

//From, in littleEndian order
//https://datatracker.ietf.org/doc/html/rfc6229
const key0=Uint8Array.of(1,2,3,4,5);
const seq0: string[] = [
    '27C03DF0056339B2',
    'A818110A4A52C3CC',
    'D582FC184F948269',
    '19090D7AA403C489'
];
const rng0=rc4_64(key0);
let i=0;
for (const expect of seq0) {
	const act = rng0();
	tsts(`rc4_64(key0)[${i}]`, () => {
        assert.equal(act.toString(),expect);
	});
	i++;
}

const key1=Uint8Array.of(1,2,3,4,5,6,7);
const seq1: string[] = [
    'B6C9377FD4023F29',
    '6BB4FE8552AFF233',
    '84BD190D39F120E6',
    'C1AF312075FDE0E2'
];
const rng1=rc4_64(key1);
i=0;
for (const expect of seq1) {
	const act = rng1();
	tsts(`rc4_64(key1)[${i}]`, () => {
        assert.equal(act.toString(),expect);
	});
	i++;
}

const key2=Uint8Array.of(0x83,0x32,0x22,0x77,0x2a);
const seq2: string[] = [
    '8ADF73C9BD97AD80',
    'DAEF97A4929E872E',
    '6512E5F2C260F020',
    'C05F0DA1FED4D301',
];
const rng2=rc4_64(key2);
i=0;
for (const expect of seq2) {
	const act = rng2();
	tsts(`rc4_64(key2)[${i}]`, () => {
        assert.equal(act.toString(),expect);
	});
	i++;
}

tsts.run();
