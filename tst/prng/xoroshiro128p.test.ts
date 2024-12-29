
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { xoroshiro128p, xoroshiro128p_2016 } from '../../src/prng/xoroshiro128';
import { U128 } from '../../src/primitive/number';
import { hex } from '../../src/codec/Hex';

const tsts = suite('xoroshiro128+');

//Unsourced, but prove that the unseeded version generates reasonable values
const seq0: string[] = [
    '509946A41CD733A3',
    'D805FCAC6824536E',
    'DADC02F3E3CF7BE3',
    '622E4DD99D2720E5',
];
const rng0=xoroshiro128p();
let i=0;
for (const expect of seq0) {
	const act = rng0();
	tsts(`xoroshiro128+()[${i}]`, () => {
        assert.equal(hex.fromBytes(act.toBytesBE()), expect);
	});
	i++;
}

//Sourced from: https://github.com/mscharley/rust-xoroshiro128/blob/master/src/tests/xoroshiro.rs
//Which also uses the 2016 a/b/c values
const seq_F1C33E163B2485144E6932AD75376EA4:string[] = [
    '402C70C3B05BF3B8',
    '4FE2A6B2DCE63BBB',
]
const rng_f=xoroshiro128p_2016(U128.fromUint32Quad(0x75376EA4,0x4E6932AD,0x3B248514,0xF1C33E16));
for (const expect of seq_F1C33E163B2485144E6932AD75376EA4) {
	const act = rng_f();
	tsts(`xoroshiro128+(seq_f)[${i}]`, () => {
        assert.equal(hex.fromBytes(act.toBytesBE()), expect);
	});
	i++;
}

//Tests from: https://asecuritysite.com/random/xo_solv
// Which uses out of date a/b/c values (55,14,36), but proves accuracy
const seq_2016:string[]=[
    '3AF8FB7F3E891315',
    '206B72696B6C6166',
    '6AE4FC311F25F529',
    'A33BAA2383A54F0A',
    'A403C782681093E4',
    '1FC7F9C48D35A4F9',
    'BDAEFBC90D9A43A2',
    '06DD63958CB5E47B',
    'A9FAAC455D0E31E1',
    '5CE24B9D2D87C94D',
];
i=0;
const rng_2016=xoroshiro128p_2016(U128.fromUint32Quad(
    0x32C4CD14,
    0x8BE85000,
    0x0BC44601,
    0xAF10AB7F,
));
for (const expect of seq_2016) {
	const act = rng_2016();
	tsts(`xoroshiro128+ (2016 seq)[${i}]`, () => {
        assert.equal(hex.fromBytes(act.toBytesBE()), expect);
	});
	i++;
}

tsts.run();
