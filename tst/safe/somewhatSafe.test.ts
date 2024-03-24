import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { safe } from '../../src/safe';
import { ILengther } from '../../src/primitive/interfaces/ILengther';

const tsts = suite('somewhatSafe');

// safe.int.is doesn't throw (Only superSafe.int.is does)
const isInt: [unknown, boolean][] = [
	[0, true],
	[1, true],

	[true, false],
	[1.1, true],
];
for (const [test, isValid] of isInt) {
	tsts(`somewhatSafe.int.is(${test})`, () => {
		if (isValid) {
			assert.not.throws(() => safe.int.is(test));
		} else {
			assert.throws(() => safe.int.is(test));
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

	[1.5, true],
];
for (const [test, inRange] of intInRange1To5) {
	tsts(`somewhatSafe.int.inRangeInc(${test},1,5)`, () => {
		if (inRange) {
			assert.not.throws(() => safe.int.inRangeInc('test', test, 1, 5));
		} else {
			assert.throws(() => safe.int.inRangeInc('test', test, 1, 5));
		}
	});
}

const intGte5Set:[number,boolean][]=[
	[0,false],
	[4,false],
	[5,true],
	[5.1,true],//5.1 isn't an int, but it is >5
	[6,true],
];
for(const [test,inRange] of intGte5Set) {
	if (inRange) {
		tsts(`somewhatSafe.int.gte(${test},5)`,()=>{
			assert.not.throws(()=>safe.int.gte('$noun',test,5));
		})
	} else {
		tsts(`somewhatSafe.int.gte(${test},5) throws`,()=>{
			assert.throws(()=>safe.int.gte('$noun',test,5));
		})
	}
}

const isFloat: [unknown, boolean][] = [
	//no checks in somewhatSafe
	[0, true],
	[1, true],
	[true, false],
	[1.1, true],
	['1.1', false],
];
for (const [test, isValid] of isFloat) {
	tsts(`somewhatSafe.float.is(${test})`, () => {
		if (isValid) {
			assert.not.throws(() => safe.float.is(test));
		} else {
			assert.throws(() => safe.float.is(test));
		}
	});
}

const isString: [unknown, boolean][] = [
	[undefined, false],
	[null, false],
	//[Symbol('nope'),false],
	[true, false],
	[0, false],
	[1.1, false],

	['yep', true],
	['', true],
];
for (const [test, isValid] of isString) {
	tsts(`safe.string.is(${test})`, () => {
		if (isValid) {
			assert.not.throws(() => safe.string.is(test));
		} else {
			assert.throws(() => safe.string.is(test));
		}
	});
}

const nullEmpty: [unknown, string | undefined][] = [
	[undefined, undefined],
	[null, undefined], //null -> undefined
	['', undefined], //empty string -> undefined
	[4, '4'], //Number coerced to string
	['hello', 'hello'],
];
for (const [test, expect] of nullEmpty) {
	tsts(`safe.string.nullEmpty(${test})`, () => {
		assert.is(safe.string.nullEmpty(test), expect);
	});
}

const lengthAtLeast: [ILengther, number, boolean][] = [
	//Anything that gives us a length element
	[new Uint8Array(0), 0, true],
	[new Uint8Array(0), 1, false],
	[new Uint8Array(10), 1, true],
	['', 1, false],
	['a', 1, true],
	['abba', 1, true],
];
for (const [test, need, expect] of lengthAtLeast) {
	if (expect) {
		tsts(`safe.len.atLeast(${test},${need})`, () => {
			assert.not.throws(()=>safe.len.atLeast('$noun',test,need));
		});	
	} else {
		tsts(`safe.len.atLeast(${test},${need}) throws`, () => {
			assert.throws(()=>safe.len.atLeast('$noun',test,need));
		});	
	}
}

const lengthExactlySet:[ILengther,number,boolean][] =[
	[new Uint8Array(1),1,true],
	[new Uint8Array(1),0,false],
	[new Uint8Array(1),2,false],
];
for(const [test,need,expect] of lengthExactlySet) {
	if (expect) {
		tsts(`safe.len.exactly(${test},${need})`,()=>{
			assert.not.throws(()=>safe.len.exactly('$noun',test,need));
		})
	} else {
		tsts(`safe.len.exactly(${test},${need}) throws`,()=>{
			assert.throws(()=>safe.len.exactly('$noun',test,need));
		})
	}
}

const zeroToFiveSet:[number,boolean][]=[
	[-1,false],
	[0,true],
	[0.00001,true],
	[5,false],
	[4.9999999,true],
];
for(const [test,expect] of zeroToFiveSet) {
	if (expect) {
		tsts(`safe.float.zeroTo(${test},5)`,()=>{
			assert.not.throws(()=>safe.float.zeroTo('$noun',test,5));
		})
	} else {
		tsts(`safe.float.zeroTo(${test},5) throws`,()=>{
			assert.throws(()=>safe.float.zeroTo('$noun',test,5));
		})
	}
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
		tsts(`safe.float.lt(${test},5)`,()=>{
			assert.not.throws(()=>safe.float.lt('$noun',test,5));
		})
	} else {
		tsts(`safe.float.lt(${test},5) throws`,()=>{
			assert.throws(()=>safe.float.lt('$noun',test,5));
		})
	}
}

tsts.run();
