import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { safe } from '../../src/safe';

const tsts = suite('safe.float');

const isFloat: [unknown, boolean][] = [
	//no checks in somewhatSafe
	[0, true],
	[1, true],
	[true, false],
	[1.1, true],
	['1.1', false],
];
for (const [test, isValid] of isFloat) {
	tsts(`is(${test})`, () => {
		if (isValid) {
			assert.not.throws(() => safe.float.is('$noun',test));
		} else {
			assert.throws(() => safe.float.is('$noun',test));
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
	if (expect) {
		tsts(`.float.lt(${test},5)`,()=>{
			assert.not.throws(()=>safe.float.lt('$noun',test,5));
		})
	} else {
		tsts(`.float.lt(${test},5) throws`,()=>{
			assert.throws(()=>safe.float.lt('$noun',test,5));
		})
	}
}

tsts.run();