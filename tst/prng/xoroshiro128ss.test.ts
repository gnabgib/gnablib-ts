
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { xoroshiro128ss } from '../../src/prng/xoroshiro128';
import { hex } from '../../src/codec/Hex';

const tsts = suite('xoroshiro128**');

//Unsourced, but prove that the unseeded version generates reasonable values
const seq0: string[] = [
    'DEC90D521E93E35D',
    '6D33AC6F18895E08',
    'AB21904EEC6FA48A',
    '87AFDBC188423FBE',
];
const rng0=xoroshiro128ss();
let i=0;
for (const expect of seq0) {
	const act = rng0();
	tsts(`xoroshiro128**()[${i}]`, () => {
        assert.equal(hex.fromBytes(act.toBytesBE()), expect);
	});
	i++;
}

tsts.run();
