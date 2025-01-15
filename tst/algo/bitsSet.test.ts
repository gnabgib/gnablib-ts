import { suite } from 'uvu';
import { bitsSet } from '../../src/algo/bitsSet';
import * as assert from 'uvu/assert';

const tsts = suite('bitsSet');

const tests: [number, number][] = [
    [0, 0],
    [1, 1],
    [2, 1],
    [3, 2],
    [4, 1],
    [2147483648, 1],//2**31
    [-1,32],
    [4294967295,32],//2**32-1
];
for (const [n, expect] of tests) {
    tsts(`bitsSet(${n})`, () => {
        const found = bitsSet(n);
        assert.equal(found, expect);
    });
}

tsts.run();
