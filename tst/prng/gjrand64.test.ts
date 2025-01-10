
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { gjrand64 } from '../../src/prng/gjrand64';
import { U64 } from '../../src/primitive/number/U64';
import { U128 } from '../../src/primitive/number/U128';

const tsts = suite('gjrand64');

//Unsourced, just showing the default seed provides reasonable randomness
const rnd0=gjrand64();
const seq0:string[]=[
    '2BB34ED3C4AED29C',
    'D541637C127368E1',
    'F836ACAFB2B05C26',
    '13183A03CE2DDD89',
    '2EF5E00C3CEA590B',
    '1847036B41FCB7F5',
    '3E3F7C895FEEEF26',
    '2DE09C062C181F4C'
];
let i=0;
for (const expect of seq0) {
    const act = rnd0();
    tsts(`gjrand64()[${i}]`, () => {
        assert.equal(act.toString(),expect);
    });
    i++;
}

//Unfortunately GJrand kat.c mixes various modes in 64bit.. but here we are
const seed_64=U64.fromUint32Pair(987654321,123456789);
const rnd_64=gjrand64(seed_64);
const seq_64:string[] = [
    '2235350C5555A578', 
    'B6212D855D88A8F7'
];
i=0;
for (const expect of seq_64) {
    const act = rnd_64();
    tsts(`gjrand64(0x075BCD153ADE68B1)[${i}]`, () => {
        assert.equal(act.toString(),expect);
    });
    i++;
}

const seed_i4=U128.fromUint32Quad(123, 456, 789, 987654321);
const rnd_i4=gjrand64(seed_i4);
const seq_i4:string[] = [
    'D30BD8DFD8821DB0', 
    'C56106C70292A42D'
];
i=0;
for (const expect of seq_i4) {
    const act = rnd_i4();
    tsts(`gjrand64(i4)[${i}]`, () => {
        assert.equal(act.toString(),expect);
    });
    i++;
}

tsts.run();