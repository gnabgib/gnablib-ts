import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Xoshiro256ss } from '../../src/prng/xoshiro256';
import { U64 } from '../../src/primitive/number/U64';
import { hex } from '../../src/codec/Hex';

const tsts = suite('xoshiro256**');

// Test vectors found in: https://github.com/Quuxplusone/Xoshiro256ss/tree/main
const seq100: string[] = [
    '0AFEE0773A0D8A51',
    '13B0CA759B9B1735',
    '5C76D220F8461395',
    '8852F10B70A289F7'
];
const rng_100=Xoshiro256ss.seed(
    U64.fromI32s(0xF13CF544,0x23259B94),
    U64.fromI32s(0xC6B89FE4,0x03BC38D6),
    U64.fromI32s(0xFBD2E5CD,0x3E540F97),
    U64.fromI32s(0x68859A70,0x40DBD7E6));
let i = 0;
for (const expect of seq100) {
	const act = rng_100.rawNext();
	tsts(`Xoshiro256**(splitMix64(100)*4).rawNext[${i}]`, () => {
		assert.equal(hex.fromBytes(act.toBytesBE()), expect);
	});
	i++;
}

// let sm100=splitMix64(U64.fromInt(0));
// console.log(sm100());//23259B94 F13CF544
// console.log(sm100());//03BC38D6 C6B89FE4
// console.log(sm100());//3E540F97 FBD2E5CD
// console.log(sm100());//40DBD7E6 68859A70

//Sourced from another repo that implements xoshiro256++
//https://gitgud.io/anglekh/prng-xoshiro/-/blob/master/test/test.js?ref_type=heads 15831
const seq_def: string[] = [
    '99EC5F36CB75F2B4',
    'BF6E1F784956452A',
    '1A5F849D4933E6E0',
    '6AA594F1262D2D2C',
    'BBA5AD4A1F842E59',
    'FFEF8375D9EBCACA',
    '6C160DEED2F54C98',
    '8920AD648FC30A3F',
    'DB032C0BA7539731',
    'EB3A475A3E749A3D',
    '1D42993FA43F2A54',
    '11361BF526A14BB5',
    '1B4F07A5AB3D8E9C',
    'A7A3257F6986DB7F',
    '7EFDAA95605DFC9C',
    '4BDE97C0A78EAAB8',
    'B455EAC43518666C',
    '304DBF6C06730690',
    '8CBE7776598A798C',
    '0ECBDF7FFCD727E5',
];
const rng_def=Xoshiro256ss.new();
i = 0;
for (const expect of seq_def) {
	const act = rng_def.rawNext();
	tsts(`Xoshiro256**().rawNext[${i}]`, () => {
		assert.equal(hex.fromBytes(act.toBytesBE()), expect);
	});
	i++;
}

//Sourced from another repo that implements xoshiro256**
//https://gitgud.io/anglekh/prng-xoshiro/-/blob/master/test/test.js?ref_type=heads 11226
const seq_1: string[] = [
    'F214A9F6519BFCCE',
    '232AFC779B684231',
    '38C402651684D125',
    '57A42EBA14878E20',
    'EDB7B7C9EEC60A21',
    '76CAACDA8F717B76',
    '6E23BF98601D62A4',
    'D27BF10CDC588B3F',
    'FF7994688911545F',
    'FBB659416F1F1568',
    'A2FD14884E3B61D2',
    'CE6D23EB2E8184D9',
    'FF0A37EA88BE06A3',
    '3A128F0B76CD5A20',
    'D859EE05AC863DD7',
    'EFEF8180569CA134',
    'D59B7B3F85C69B9F',
    '8EB05E437558908A',
    'CAA9983A1E76EA32',
    '8B721B33265CC975',
];
const rng_1c=Xoshiro256ss.seed(
    U64.fromI32s(0x36ed852f,0x96a1743c),
    U64.fromI32s(0x32c50c9f,0x8c0ac257),
    U64.fromI32s(0xc2947a21,0xec65ea85),
    U64.fromI32s(0xfe9971f9,0x6cd5a2d6));
i = 0;
for (const expect of seq_1) {
	const act = rng_1c.rawNext();
	tsts(`Xoshiro256**(seed).rawNext[${i}]`, () => {
		assert.equal(hex.fromBytes(act.toBytesBE()), expect);
	});
	i++;
}

tsts(`Xoshiro256**(,false) save returns empty, restore throws`,()=>{
    const r=Xoshiro256ss.new();
    const sav=r.save();
    assert.equal(sav.length,0);
    assert.throws(()=>Xoshiro256ss.restore(sav));
})

tsts(`Xoshiro256**().save/restore loop`,()=>{
    const r=Xoshiro256ss.new(true);
    assert.equal(r.rawNext().toString(),seq_def[0],'r consume[0]');
    const sav=r.save();
    assert.equal(sav.length,32,'save length');
    assert.equal(r.rawNext().toString(),seq_def[1],'r consume[1]');
    assert.equal(r.rawNext().toString(),seq_def[2],'r consume[2]');

    const r2=Xoshiro256ss.restore(sav);    
    assert.equal(r2.rawNext().toString(),seq_def[1],'r2 still at [1]');
    assert.equal(r.rawNext().toString(),seq_def[3],'r consume[3]');

    assert.is(Object.prototype.toString.call(r).indexOf("xoshiro256**")>0,true,'toString is set');
});

tsts.run();
