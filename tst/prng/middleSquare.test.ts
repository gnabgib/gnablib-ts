import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { MiddleSquare } from '../../src/prng/middleSquare';

const tsts = suite('MiddleSquare');

//https://en.wikipedia.org/wiki/Middle-square_method#/media/File:Middle_square_method_2_digits.svg
const seq_42:number[]=[
    76,77,92,46,11,12,14,19,36,29,84,5,2,0,0
];
const rng_42=MiddleSquare.seed(42);
let i = 0;
for (const expect of seq_42) {
    const act = rng_42.rawNext();
    tsts(`MiddleSquare(42).rawNext[${i}]`, () => {
        assert.equal(act, expect);
    });
    i++;
}

//https://en.wikipedia.org/wiki/Middle-square_method#/media/File:Middle-square_method.svg
const seq_675248:number[]=[
    959861,333139
];
const rng_675248=MiddleSquare.seed(675248);
i = 0;
for (const expect of seq_675248) {
    const act = rng_675248.rawNext();
    tsts(`MiddleSquare(675248).rawNext[${i}]`, () => {
        assert.equal(act, expect);
    });
    i++;
}

const seq_4660:number[]=[
    7156,2083,3388,4785,8962,3174
];
const rng_4660=MiddleSquare.seed(4660);
i = 0;
for (const expect of seq_4660) {
    const act = rng_4660.rawNext();
    tsts(`MiddleSquare(4660).rawNext[${i}]`, () => {
        assert.equal(act, expect);
    });
    i++;
}
tsts(`MiddleSquare(4660).nextU16`,()=>{
    const rng_4660b=MiddleSquare.seed(4660);
    assert.equal(rng_4660b.bitGen,14,'Max 14 bits of random');
    //Note these numbers come from seq_4660 above
    assert.equal(rng_4660b.nextU16(),7156<<2|2083>>>12);
    assert.equal(rng_4660b.nextU16(),3388<<2|4785>>>12);
    assert.equal(rng_4660b.nextU16(),8962<<2|3174>>>12);
})

const bad_seeds:number[]=[
    0,
    1,
    121,
    12321,
    0x100000000,//4294967296 Because only the last 32bits are used this is zero
];
for(const seed of bad_seeds) {
    tsts(`MiddleSquare(${seed}) throws`,()=>{
        assert.throws(()=>MiddleSquare.seed(seed));
    })    
}

tsts(`MiddleSquare(,false) save returns empty, restore throws`,()=>{
    const r=MiddleSquare.seed(42);
    const sav=r.save();
    assert.equal(sav.length,0);
    assert.throws(()=>MiddleSquare.restore(sav));
})

tsts(`MiddleSquare().save/restore loop`,()=>{
    const r=MiddleSquare.seed(42,2,true);
    assert.equal(r.rawNext(),seq_42[0],'r consume[0]');
    const sav=r.save();
    assert.equal(sav.length,5,'save length');
    assert.equal(r.rawNext(),seq_42[1],'r consume[1]');
    assert.equal(r.rawNext(),seq_42[2],'r consume[2]');

    const r2=MiddleSquare.restore(sav);    
    assert.equal(r2.rawNext(),seq_42[1],'r2 still at [1]');
    assert.equal(r.rawNext(),seq_42[3],'r consume[3]');

    assert.is(Object.prototype.toString.call(r).indexOf("middlesquare")>0,true,'toString is set');
});

tsts.run();
