
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Arc4 } from '../../src/prng/arc4';
import { hex } from '../../src/codec/Hex';
import { U64 } from '../../src/primitive/number';

const tsts = suite('Arc4');

//There's no source for this, just showing without a key a reasonable random stream is created
const seq_def:number[]=[
    0x2C,0x1B,0xC8,0xCD,
    0xB2,0x5F,0xDB,0x06,
    0x0A,0x61,0xF5,0x0C,
    0x51,0xDA,0x5E,0x06
];
const rng_def=Arc4.new();
let i=0;
for (const expect of seq_def) {
	const act = rng_def.rawNext();
	tsts(`Arc4().rawNext[${i}]`, () => {
        assert.equal(act,expect);
	});
	i++;
}

//Source: https://datatracker.ietf.org/doc/html/rfc6229
const key_1_2_3_4_5=Uint8Array.of(1,2,3,4,5);
const seq_1_2_3_4_5:number[]=[
    0xB2,0x39,0x63,0x05,
    0xF0,0x3D,0xC0,0x27,
    0xCC,0xC3,0x52,0x4A,
    0x0A,0x11,0x18,0xA8,
    0x69,0x82,0x94,0x4F,
    0x18,0xFC,0x82,0xD5,
    0x89,0xC4,0x03,0xA4,
    0x7A,0x0D,0x09,0x19
];
const rng_1_2_3_4_5=Arc4.seed(key_1_2_3_4_5);
i=0;
for (const expect of seq_1_2_3_4_5) {
	const act = rng_1_2_3_4_5.rawNext();
	tsts(`Arc4(1,2,3,4,5).rawNext[${i}]`, () => {
        assert.equal(act,expect);
	});
	i++;
}
for(;i<1024;i++) rng_1_2_3_4_5.rawNext();
const seq_1_2_3_4_5_1024plus: number[] = [
    0x30,0xAB,0xBC,0xC7,
    0xC2,0x0B,0x01,0x60,
    0x9F,0x23,0xEE,0x2D,
    0x5F,0x6B,0xB7,0xDF
];
i=0;
for (const expect of seq_1_2_3_4_5_1024plus) {
	const act = rng_1_2_3_4_5.rawNext();
	tsts(`Arc4(1,2,3,4,5).rawNext[1024+${i}]`, () => {
        assert.equal(act,expect);
	});
	i++;
}

const seq_1_2_3_4_5_u32:number[]=[
    0xB2396305,
    0xF03DC027,
    0xCCC3524A,
    0x0A1118A8,
    0x6982944F,
    0x18FC82D5,
    0x89C403A4,
    0x7A0D0919
];
const rng_1_2_3_4_5b=Arc4.seed(key_1_2_3_4_5);
i=0;
for (const expect of seq_1_2_3_4_5_u32) {
	const act = rng_1_2_3_4_5b.nextU32();
	tsts(`Arc4(1,2,3,4,5).nextU32[${i}]`, () => {
        assert.equal(act,expect,hex.fromI32(expect));
	});
	i++;
}

const key_1_2_3_4_5_6_7=Uint8Array.of(1,2,3,4,5,6,7);
const seq_1_2_3_4_5_6_7:number[]=[
    0x29,0x3F,0x02,0xD4,
    0x7F,0x37,0xC9,0xB6,
    0x33,0xF2,0xAF,0x52,
    0x85,0xFE,0xB4,0x6B,
    0xE6,0x20,0xF1,0x39,
    0x0D,0x19,0xBD,0x84,
    0xE2,0xE0,0xFD,0x75,
    0x20,0x31,0xAF,0xC1
];
const rng_1_2_3_4_5_6_7=Arc4.seed(key_1_2_3_4_5_6_7);
i=0;
for (const expect of seq_1_2_3_4_5_6_7) {
	const act = rng_1_2_3_4_5_6_7.rawNext();
	tsts(`Arc4(1,2,3,4,5,6,7).rawNext[${i}]`, () => {
        assert.equal(act,expect,hex.fromByte(expect));
	});
	i++;
}

const key_83_32_22_77_2a=Uint8Array.of(0x83,0x32,0x22,0x77,0x2a);
const seq_83_32_22_77_2a:number[]=[
    0x80,0xAD,0x97,0xBD,
    0xC9,0x73,0xDF,0x8A,
    0x2E,0x87,0x9E,0x92,
    0xA4,0x97,0xEF,0xDA,
    0x20,0xF0,0x60,0xC2,
    0xF2,0xE5,0x12,0x65,
    0x01,0xD3,0xD4,0xFE,
    0xA1,0x0D,0x5F,0xC0
];
const rng_83_32_22_77_2a=Arc4.seed(key_83_32_22_77_2a);
i=0;
for (const expect of seq_83_32_22_77_2a) {
	const act = rng_83_32_22_77_2a.rawNext();
	tsts(`Arc4(83,32,22,77,2A).rawNext[${i}]`, () => {
        assert.equal(act,expect,hex.fromByte(expect));
	});
	i++;
}

tsts(`Arc4(,false) save returns empty, restore throws`,()=>{
    const r=Arc4.new();
    const sav=r.save();
    assert.equal(sav.length,0);
    assert.throws(()=>Arc4.restore(sav));
})

tsts(`Arc4().save/restore loop`,()=>{
    const r=Arc4.new(true);
    assert.equal(r.rawNext(),seq_def[0],'r consume[0]');
    const sav=r.save();
    assert.equal(sav.length,258,'save length');
    assert.equal(r.rawNext(),seq_def[1],'r consume[1]');
    assert.equal(r.rawNext(),seq_def[2],'r consume[2]');

    const r2=Arc4.restore(sav);    
    assert.equal(r2.rawNext(),seq_def[1],'r2 still at [1]');
    assert.equal(r.rawNext(),seq_def[3],'r consume[3]');

    assert.is(Object.prototype.toString.call(r).indexOf("arc4")>0,true,'toString is set');
});

tsts(`Arc4().U64 gen`,()=>{
    const rng_def=Arc4.new();
    const u64=U64.fromArray(Uint32Array.of(...rng_def.seqU32(2)));
    //Little endian so first U32 is low-order
    assert.equal(u64.toString(),'B25FDB062C1BC8CD');
    //console.log(u64);
});

tsts.run();
