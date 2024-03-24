import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { superSafe } from '../../src/safe';

const tsts = suite('superSafe.int');

const isSet: [unknown, boolean][] = [
	[0, true],
	[1, true],

	[true, false],
	[1.1, false],
];
for (const [test, isValid] of isSet) {
	tsts(`is(${test})`, () => {
		if (isValid) {
			assert.not.throws(() => superSafe.int.is('$noun',test));
		} else {
			assert.throws(() => superSafe.int.is('$noun',test));
		}
	});
}

const inRange1To5Set: [number, boolean][] = [
	[0, false],
	[1, true],
	[2, true] /*! Copyright 2024 the gnablib contributors MPL-1.1 */,
	[4, true],
	[5, true],
	[6, false],

	[1.5, false],
];
for (const [test, inRange] of inRange1To5Set) {
	tsts(`inRangeInc(${test},1,5)`, () => {
		if (inRange) {
			assert.not.throws(() => superSafe.int.inRangeInc('test', test, 1, 5));
		} else {
			assert.throws(() => superSafe.int.inRangeInc('test', test, 1, 5));
		}
	});
}

const gte5Set:[number,boolean][]=[
	[0,false],
	[4,false],
	[5,true],
	[5.1,false],//5.1 is gte, but it isn't an int
	[6,true],
];
for(const [test,inRange] of gte5Set) {
    tsts(`gte(${test},5)`,()=>{
        if (inRange) {
            assert.not.throws(()=>superSafe.int.gte('$noun',test,5));
        } else {
            assert.throws(()=>superSafe.int.gte('$noun',test,5));
        }
    })
}

const lt5Set:[number,boolean][]=[
    [-1.5,false],//Not an int
    [-1,true],
	[0,true],
	[4,true],
    [4.9,false],//not an int
	[5,false],
	[5.1,false],
	[6,false],
];
for(const [test,inRange] of lt5Set) {
    tsts(`lt(${test},5)`,()=>{
        if (inRange) {
            assert.not.throws(()=>superSafe.int.lt('$noun',test,5));
        } else {
            assert.throws(()=>superSafe.int.lt('$noun',test,5));
        }
    })
}

const lte5Set:[number,boolean][]=[
    [-1.5,false],//Not an int
    [-1,true],
	[0,true],
	[4,true],
    [4.9,false],//not an int
	[5,true],
	[5.1,false],
	[6,false],
];
for(const [test,inRange] of lte5Set) {
    tsts(`lte(${test},5)`,()=>{
        if (inRange) {
            assert.not.throws(()=>superSafe.int.lte('$noun',test,5));
        } else {
            assert.throws(()=>superSafe.int.lte('$noun',test,5));
        }
    })
}

tsts.run();