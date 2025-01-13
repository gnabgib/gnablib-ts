
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { tychei } from '../../src/prng/tychei';
import { U64 } from '../../src/primitive/number/U64';

const tsts = suite('tychei');

//Unsourced, just showing the default seed provides reasonable randomness
const rnd0=tychei();
const seq0:number[]=[
    699550068,
    1915753960,
    1728359319,
    3386243413,
    2946823904,
    1973207123,
    3326894554,
    3191394185
];
let i=0;
for (const expect of seq0) {
    const act = rnd0();
    tsts(`tychei(0)[${i}]`, () => {
        assert.equal(act,expect);
    });
    i++;
}

const seed_64=U64.fromUint32Pair(1,2);
const rnd_64=tychei(seed_64);
const seq_64:number[] = [
    2108476295,
    2775575075
];
i=0;
for (const expect of seq_64) {
    const act = rnd_64();
    tsts(`tychei(1,2)[${i}]`, () => {
        assert.equal(act,expect);
    });
    i++;
}

tsts.run();