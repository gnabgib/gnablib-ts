import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { superSafe } from '../../src/safe';

const tsts = suite('superSafe.float');

const isFloat: [unknown, boolean][] = [
	//no checks in somewhatSafe
	[0, true],
	[1, true],
	[1.1, true],

	[true, false],
	['1.1', false],
];
for (const [test, isValid] of isFloat) {
	tsts(`somewhatSafe.float.is(${test})`, () => {
		if (isValid) {
			assert.not.throws(() => superSafe.float.is('$noun',test));
		} else {
			assert.throws(() => superSafe.float.is('$noun',test));
		}
	});
}

const ltFiveSet:[number,boolean][]=[
	[-1,true],
	[0,true],
	[0.00001,true],
	[5,false],
	[4.9999999,true],
];
for(const [test,expect] of ltFiveSet) {
	//Note this is the same as somewhatSafe
	if (expect) {
		tsts(`safe.float.lt(${test},5)`,()=>{
			assert.not.throws(()=>superSafe.float.lt('$noun',test,5));
		})
	} else {
		tsts(`safe.float.lt(${test},5) throws`,()=>{
			assert.throws(()=>superSafe.float.lt('$noun',test,5));
		})
	}
}

tsts.run();
