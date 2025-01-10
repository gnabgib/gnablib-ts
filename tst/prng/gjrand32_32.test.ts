
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { gjrand32_32 } from '../../src/prng/gjrand32';

const tsts = suite('gjrand32_32');

//Note despite the similar name, these tests which match include some of the same seeds
// `gjrand32`, produce different numbers.

//Can't find a reasonable testing source for these numbers, plus it's a slightly modified form
// of a GIST of a modified form.. but; we can how that reasonable random sequences are generated
// and the results are different from the 256 state version

const rnd0=gjrand32_32();

const seq0:number[]=[
    3549022456,
    2524684144,
    155375143,
    3949942373,
    3808574447,
    3502790569,
    1423479935,
    2012571532
];
let i=0;
for (const expect of seq0) {
    const act = rnd0();
    tsts(`gjrand32_32()[${i}]`, () => {
        assert.equal(act,expect);
    });
    i++;
}

const rnd_42=gjrand32_32(42);
const seq_42:number[] = [
    2277141955,
    1806337049
];
i=0;
for (const expect of seq_42) {
    const act = rnd_42();
    tsts(`gjrand32_32(42)[${i}]`, () => {
        assert.equal(act,expect);
    });
    i++;
}

const rnd_64=gjrand32_32(987654321,123456789);
const seq_64:number[] = [
    1300271190, 
    805416957
];
i=0;
for (const expect of seq_64) {
    const act = rnd_64();
    tsts(`gjrand32_32(987654321,123456789)[${i}]`, () => {
        assert.equal(act,expect);
    });
    i++;
}

tsts.run();