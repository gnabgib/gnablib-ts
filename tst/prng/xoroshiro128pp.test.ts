
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { xoroshiro128pp } from '../../src/prng/xoroshiro128';
import { hex } from '../../src/codec/Hex';

const tsts = suite('xoroshiro128++');

//Unsourced, but prove that the unseeded version generates reasonable values
const seq0: string[] = [
    '6F68E1E7E2646EE1',
    'BF971B7F454094AD',
    '48F2DE556F30DE38',
    '6EA7C59F89BBFC75',
];
const rng0=xoroshiro128pp();
let i=0;
for (const expect of seq0) {
	const act = rng0();
	tsts(`xoroshiro128++()[${i}]`, () => {
        assert.equal(hex.fromBytes(act.toBytesBE()), expect);
	});
	i++;
}

tsts.run();
