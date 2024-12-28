
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { xorShift128plusV8 } from '../../src/prng/xorShift128plus';
import { U128 } from '../../src/primitive/number';
import { hex } from '../../src/codec/Hex';

const tsts = suite('xorShift128');
//https://vigna.di.unimi.it/ftp/papers/xorshiftplus.pdf
//No reasonable source for vectors found (yet), but note the first number matches xorShift128plus 
// (because different a/b/c change the second and subsequent rounds)
const seq_x159A55E500000000075BCD15: string[] = [
    '000000001CF622FA', 
    '0003ADE7644D33FD',
    '000D0EB01E895FBB',
    'F3B74E5BC54ECE74',
    '8B7141A43B09F3B5',
];

const rng_x159A55E500000000075BCD15 = xorShift128plusV8(U128.fromUint32Quad(123456789,0,362436069,0));
//0x000000000 159A55E5 00000000 075BCD15 / 6685765407924336135579094293
let i = 0;
for (const expect of seq_x159A55E500000000075BCD15) {
	const act = rng_x159A55E500000000075BCD15();
	tsts(`xorShift128(x159A55E500000000075BCD15)[${i}]`, () => {
        assert.equal(hex.fromBytes(act.toBytesBE()), expect);
	});
	i++;
}


tsts.run();
