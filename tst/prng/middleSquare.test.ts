import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { middleSquare } from '../../src/prng/middleSquare';

const tsts = suite('middleSquare');
const set:[number,number[]][]=[
    //https://en.wikipedia.org/wiki/Middle-square_method#/media/File:Middle_square_method_2_digits.svg
    [42,[76,77,92,46,11,12,14,19,36,29,84,5,2,0,0]],
    //https://en.wikipedia.org/wiki/Middle-square_method#/media/File:Middle-square_method.svg
    [675248,[959861,333139]],
]
for(const [seed,expect] of set) {
    tsts(`middleSquare(${seed})`,()=>{
        const r=middleSquare(seed);
        for(let i=0;i<expect.length;i++) {
            assert.equal(r(),expect[i],'r'+i);
        }
    })
}

const badSeedSet:number[]=[
    //Cannot be zero
    0,
    //Cannot be odd:
    1,
    121,
    12321,
];
for(const seed of badSeedSet) {
    tsts(`middleSquare(${seed}) throws`,()=>{
        assert.throws(()=>middleSquare(seed));    
    })    
}

tsts.run();
