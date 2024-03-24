import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { safe } from '../../src/safe';

const tsts = suite('safe.int');

const isSet: [unknown, boolean][] = [
	[0, true],
	[1, true],

	[true, false],
	[1.1, true],//!
	['1.1', false],
];
for (const [test, isValid] of isSet) {
	tsts(`is(${test})`, () => {
		if (isValid) {
			assert.not.throws(() => safe.int.is('$noun',test));
		} else {
			assert.throws(() => safe.int.is('$noun',test));
		}
	});
}

//safe.int.inRangeInc doesn't confirm integer-ness
const intInRange1To5: [number, boolean][] = [
	[0, false],
	[1, true],
	[2, true],
	[4, true],
	[5, true],
	[6, false],

	[1.5, true],//!
];
for (const [test, inRange] of intInRange1To5) {
	tsts(`inRangeInc(${test},1,5)`, () => {
		if (inRange) {
			assert.not.throws(() => safe.int.inRangeInc('test', test, 1, 5));
		} else {
			assert.throws(() => safe.int.inRangeInc('test', test, 1, 5));
		}
	});
}

const gte5Set:[number,boolean][]=[
	[0,false],
	[4,false],
	[5,true],
	[5.1,true],//5.1 isn't an int, but it is >5
	[6,true],
];
for(const [test,inRange] of gte5Set) {
    tsts(`gte(${test},5)`,()=>{
        if (inRange) {
            assert.not.throws(()=>safe.int.gte('$noun',test,5));
        } else {
            assert.throws(()=>safe.int.gte('$noun',test,5));
        }
    })
}

const lt5Set:[number,boolean][]=[
    [-1.5,true],
    [-1,true],
	[0,true],
	[4,true],
    [4.9,true],
	[5,false],
	[5.1,false],
	[6,false],
];
for(const [test,inRange] of lt5Set) {
    tsts(`lt(${test},5)`,()=>{
        if (inRange) {
            assert.not.throws(()=>safe.int.lt('$noun',test,5));
        } else {
            assert.throws(()=>safe.int.lt('$noun',test,5));
        }
    })
}

const lte5Set:[number,boolean][]=[
    [-1.5,true],
    [-1,true],
	[0,true],
	[4,true],
    [4.9,true],
	[5,true],
	[5.1,false],
	[6,false],
];
for(const [test,inRange] of lte5Set) {
    tsts(`lte(${test},5)`,()=>{
        if (inRange) {
            assert.not.throws(()=>safe.int.lte('$noun',test,5));
        } else {
            assert.throws(()=>safe.int.lte('$noun',test,5));
        }
    })
}

tsts.run();
