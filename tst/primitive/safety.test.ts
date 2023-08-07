import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { safety } from '../../src/primitive';

const tsts = suite('safety');

const isIntTest:[unknown,boolean][]=[
    [1,false],   
    [false,true],//bool is not an int
    ['not an int',true],//string is not an int
];
let i=0;
for(const [test,throws] of isIntTest) {
    tsts(`isInt[${i++}]`,()=>{
        if (throws) {
            assert.throws(()=>safety.isInt(test));
        } else {
            assert.equal(safety.isInt(test),test);
        }
    })
}

const intInRangeInc1_5Test:[number|undefined,boolean][]=[
    [0,true],
    [1,false],
    [5,false],
    [6,true],//out of range
    [undefined,true],//string is not an int
];
i=0;
for(const [test,throws] of intInRangeInc1_5Test) {
    tsts(`intInRangeInc[${i++}]`,()=>{
        if (throws) {
            assert.throws(()=>safety.intInRangeInc(test,1,5));
        } else {
            safety.intInRangeInc(test,1,5);
        }
    })
}

const intInRangeIncExc1_5Test:[number|undefined,boolean][]=[
    [0,true],//out of range
    [1,false],
    [2,false],
    [5,true],//out of range
    [6,true],//out of range
    [undefined,true],//string is not an int
];
i=0;
for(const [test,throws] of intInRangeIncExc1_5Test) {
    tsts(`intInRangeIncExc[${i++}]`,()=>{
        if (throws) {
            assert.throws(()=>safety.intInRangeIncExc(test,1,5));
        } else {
            safety.intInRangeIncExc(test,1,5);
        }
    })
}

const intGte1Test:[number|undefined,boolean][]=[
    [0,true],//out of range
    [1,false],
    [2,false],
    [5,false],
    [6,false],    
    [undefined,true],//string is not an int
];
i=0;
for(const [test,throws] of intGte1Test) {
    tsts(`intGte[${i++}]`,()=>{
        if (throws) {
            assert.throws(()=>safety.intGte(test,1));
        } else {
            safety.intGte(test,1);
        }
    })
}

const intGt1Test:[number|undefined,boolean][]=[
    [0,true],//out of range
    [1,true],//out of range
    [2,false],
    [5,false],
    [6,false],    
    [undefined,true],//string is not an int
];
i=0;
for(const [test,throws] of intGt1Test) {
    tsts(`intGt[${i++}]`,()=>{
        if (throws) {
            assert.throws(()=>safety.intGt(test,1));
        } else {
            safety.intGt(test,1);
        }
    })
}

const intSatisfiesEvenGt0Test:[number|undefined,boolean][]=[
    [0,true],//out of range
    [1,true],//out of range
    [2,false],//out of range
    [3,true],
    [4,false],//out of range
    [5,true],
    [undefined,true],//string is not an int
];
i=0;
for(const [test,throws] of intSatisfiesEvenGt0Test) {
    const r=(t:number)=>t>0&&t%2==0;
    tsts(`intSatisfies[${i++}]`,()=>{
        if (throws) {
            assert.throws(()=>safety.intSatisfies(test,r));
        } else {
            safety.intSatisfies(test,r);
        }
    })
}

const notNullTest:[number|undefined|null,boolean][]=[
    [0,false],
    [1,false],
    [undefined,true],
    [null,true],
];
i=0;
for(const [test,throws] of notNullTest) {
    tsts(`notNull[${i++}]`,()=>{
        if (throws) {
            assert.throws(()=>safety.notNull(test));
        } else {
            safety.notNull(test);
        }
    })
}

const lenInRangeInc1_5Test:[string|undefined,boolean][]=[
    ['',true],//Too short
    ['a',false],
    [undefined,true],//Invalid
    ['eleven',true],//Too long
];
i=0;
for(const [test,throws] of lenInRangeInc1_5Test) {
    tsts(`lenInRangeInc[${i++}]`,()=>{
        if (throws) {
            assert.throws(()=>safety.lenInRangeInc(test,1,5));
        } else {
            safety.lenInRangeInc(test,1,5);
        }
    })
}

const lenExactly1Test:[string|undefined,boolean][]=[
    ['',true],//Too short
    ['a',false],
    ['ab',true],//Too long
    [undefined,true],//Invalid
];
i=0;
for(const [test,throws] of lenExactly1Test) {
    tsts(`lenExactly[${i++}]`,()=>{
        if (throws) {
            assert.throws(()=>safety.lenExactly(test,1));
        } else {
            safety.lenExactly(test,1);
        }
    })
}

const lenGte1Test:[string|undefined,boolean][]=[
    ['',true],//Too short
    ['a',false],
    ['ab',false],
    [undefined,true],//Invalid
];
i=0;
for(const [test,throws] of lenGte1Test) {
    tsts(`lenExactly[${i++}]`,()=>{
        if (throws) {
            assert.throws(()=>safety.lenGte(test,1));
        } else {
            safety.lenGte(test,1);
        }
    })
}

const numInRangeIncExc1_5Test:[number|undefined,boolean][]=[
    [0,true],//out of range
    [1,false],
    [2,false],
    [5,true],//out of range
    [6,true],//out of range
];
i=0;
for(const [test,throws] of numInRangeIncExc1_5Test) {
    tsts(`numInRangeIncExc[${i++}]`,()=>{
        if (throws) {
            assert.throws(()=>safety.numInRangeIncExc(test,1,5));
        } else {
            safety.numInRangeIncExc(test,1,5);
        }
    })
}

const numInRangeInc1_5Test:[number|undefined,boolean][]=[
    [0,true],//out of range
    [1,false],
    [2,false],
    [5,false],
    [6,true],//out of range
];
i=0;
for(const [test,throws] of numInRangeInc1_5Test) {
    tsts(`numInRangeInc[${i++}]`,()=>{
        if (throws) {
            assert.throws(()=>safety.numInRangeInc(test,1,5));
        } else {
            safety.numInRangeInc(test,1,5);
        }
    })
}

const numGte1Test:[number|undefined,boolean][]=[
    [0,true],//out of range
    [1,false],
    [2,false],
];
i=0;
for(const [test,throws] of numGte1Test) {
    tsts(`numGte[${i++}]`,()=>{
        if (throws) {
            assert.throws(()=>safety.numGte(test,1));
        } else {
            safety.numInRangeInc(test,1);
        }
    })
}

tsts.run();
