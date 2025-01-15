
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Pcg32 } from '../../src/prng/pcg32';
import { U64 } from '../../src/primitive/number/U64';

const tsts = suite('Pcg32');

//Just to show with no seed, reasonable random
const seq_def: number[] = [
    355248013,
    41705475,
    3406281715,
    4186697710,
];
const rng_def=Pcg32.new();
let i=0;
for (const expect of seq_def) {
	const act = rng_def.rawNext();
	tsts(`Pcg32().rawNext[${i}]`, () => {
        assert.equal(act,expect);
	});
	i++;
}

// These test vectors are provided in https://github.com/imneme/pcg-c/tree/master/test-high/expected/check-pcg32.out
const seq_seedInc0:number[]=[
    0xa15c02b7,
    0x7b47f409,
    0xba1d3330,
    0x83d2f293,
    0xbfa4784b,
    0xcbed606e,
];
const rng_seedInc=Pcg32.seed(U64.fromInt(42),U64.fromInt(54));
i=0;
for (const expect of seq_seedInc0) {
	const act = rng_seedInc.rawNext();
	tsts(`Pcg32(42,54).rawNext[${i}]`, () => {
        assert.equal(act,expect);
	});
	i++;
}

//No source, just proving you don't have to supply an increment too
const seq_seed:number[]=[
    3718933621,
    842511388
];
const rng_seed=Pcg32.seed(U64.fromInt(42));
i=0;
for (const expect of seq_seed) {
	const act = rng_seed.rawNext();
	tsts(`Pcg32(42).rawNext[${i}]`, () => {
        assert.equal(act,expect);
	});
	i++;
}

tsts(`Pcg32(,false) save returns empty, restore throws`,()=>{
    const r=Pcg32.new();
    const sav=r.save();
    assert.equal(sav.length,0);
    assert.throws(()=>Pcg32.restore(sav));
})

tsts(`Pcg32().save/restore loop`,()=>{
    const r=Pcg32.new(true);
    assert.equal(r.rawNext(),seq_def[0],'r consume[0]');
    const sav=r.save();
    assert.equal(sav.length,16,'save length');
    assert.equal(r.rawNext(),seq_def[1],'r consume[1]');
    assert.equal(r.rawNext(),seq_def[2],'r consume[2]');

    const r2=Pcg32.restore(sav);    
    assert.equal(r2.rawNext(),seq_def[1],'r2 still at [1]');
    assert.equal(r.rawNext(),seq_def[3],'r consume[3]');

    assert.is(Object.prototype.toString.call(r).indexOf("pcg32")>0,true,'toString is set');
});



// //These test vectors were found in another library, sourced from the CPP reference impl
// //They worked when state/inc were directly stored, but C source has a seeding process than runs a couple of randoms
// const inc=U64.fromUint32Pair(0xF767814F,0x14057B7E);
// const seq_seed0:number[]=[
//     676697322, 420258633, 3418632178, 3595600211, 3265791279, 257272927,
//     3607051826, 1330014364, 1691133457, 2692391003, 1436966076, 3405603488, 3196723772,
//     2037651542, 1789776910, 3642929604, 3134326335, 2746793161, 2907548636, 3720053141,
// ];
// const rng_seed0=pcg32(U64.fromUint32Pair(0xd0f33173,0x4d595df4),inc);
// i=0;
// for (const expect of seq_seed0) {
// 	const act = rng_seed0();
// 	tsts(`pcg32(seed0)[${i}]`, () => {
//         assert.equal(act,expect);
// 	});
// 	i++;
// }

// //These test vectors were found in another library, sourced from the CPP reference impl
// const seq_seed1:number[]=[
//     2191333665, 1496534883, 1975480820, 3964832384, 3952842012, 699877961,
//   766099024, 3832042469, 317477406, 1735065530, 769368729, 3530453751, 1238223033, 2705512115,
//   1702475146, 3390600453, 2733117708, 2286600132, 143739048, 4178275569,
// ];
// const rng_seed1=pcg32(U64.fromUint32Pair(0xd3f12149,0x6d193ac4),inc);
// i=0;
// for (const expect of seq_seed1) {
// 	const act = rng_seed1();
// 	tsts(`pcg32(seed1)[${i}]`, () => {
//         assert.equal(act,expect);
// 	});
// 	i++;
// }

tsts.run();
