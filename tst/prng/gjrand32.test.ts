
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { gjrand32 } from '../../src/prng/gjrand64';
import { U128, U64 } from '../../src/primitive/number';

const tsts = suite('gjrand32');

//Unsourced, just showing the default seed provides reasonable randomness
const rnd0=gjrand32();
//const rnd_0=gjrand32(0);
const seq0:number[]=[
    3299791516,
    309553377,
    2997902374,
    3459112329,
    1021991179,
    1107081205,
    1609494310,
    739778380
];
let i=0;
for (const expect of seq0) {
    const act = rnd0();
    tsts(`gjrand32()[${i}]`, () => {
        assert.equal(act,expect);
    });
    i++;
}

//From gjrand source kat.c
const rnd_42=gjrand32(42);
const seq_42:number[] = [
    4215254626,
    //This isn't in the kat, just proving the number changes
    2071241339
];
i=0;
for (const expect of seq_42) {
    const act = rnd_42();
    tsts(`gjrand32(42)[${i}]`, () => {
        assert.equal(act,expect);
    });
    i++;
}

//From gjrand source kat.c
const rnd_64=gjrand32(U64.fromUint32Pair(987654321,123456789));
const seq_64:number[] = [
    1431676280, 
    //This isn't in the kat, just proving the number changes
    1569237239
];
i=0;
for (const expect of seq_64) {
    const act = rnd_64();
    tsts(`gjrand32(987654321,123456789)[${i}]`, () => {
        assert.equal(act,expect);
    });
    i++;
}

//From gjrand source kat.c
const rnd_i4=gjrand32(U128.fromUint32Quad(123, 456, 789, 987654321));
const seq_i4:number[] = [
    3632405936, 
    //This isn't in the kat, just proving the number changes
    43164717
];
i=0;
for (const expect of seq_i4) {
    const act = rnd_i4();
    tsts(`gjrand32(i4)[${i}]`, () => {
        assert.equal(act,expect);
    });
    i++;
}

tsts.run();