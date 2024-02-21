import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { somewhatSafe } from '../../src/safe';
import { ILengther } from '../../src/primitive/interfaces/ILengther';

const tsts = suite('somewhatSafe');

// safe.int.is doesn't throw (Only superSafe.int.is does)
const isInt: [unknown, boolean][] = [
	[0, true],
	[1, true],

	[true, true],
	[1.1, true],
];
for (const [test, isValid] of isInt) {
	tsts(`somewhatSafe.int.is(${test})`, () => {
		if (isValid) {
			assert.not.throws(() => somewhatSafe.int.is(test));
		} else {
			assert.throws(() => somewhatSafe.int.is(test));
		}
	});
}

const intCoerceSet: [unknown, number][] = [
	['', 0],
	['1', 1],
	[1.9, 1],
	[true, 1],
	[123, 123],
];
for (const [input, expect] of intCoerceSet) {
	tsts(`somewhatSafe.int.coerce(${input})`, () => {
		assert.is(expect, somewhatSafe.int.coerce(input));
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
			assert.not.throws(() => somewhatSafe.int.inRangeInc('test', test, 1, 5));
		} else {
			assert.throws(() => somewhatSafe.int.inRangeInc('test', test, 1, 5));
		}
	});
}

const intGt5Set:[number,boolean][]=[
	[0,false],
	[4,false],
	[5,false],
	[5.1,true],
	[6,true],
];
for(const [test,inRange] of intGt5Set) {
	if (inRange) {
		tsts(`somewhatSafe.int.gt(${test},5)`,()=>{
			assert.not.throws(()=>somewhatSafe.int.gt('$noun',test,5));
		})
	} else {
		tsts(`somewhatSafe.int.gt(${test},5) throws`,()=>{
			assert.throws(()=>somewhatSafe.int.gt('$noun',test,5));
		})
	}
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
			assert.not.throws(()=>somewhatSafe.int.gte('$noun',test,5));
		})
	} else {
		tsts(`somewhatSafe.int.gte(${test},5) throws`,()=>{
			assert.throws(()=>somewhatSafe.int.gte('$noun',test,5));
		})
	}
}

const isFloat: [unknown, boolean][] = [
	//no checks in somewhatSafe
	[0, true],
	[1, true],
	[true, true],
	[1.1, true],
	['1.1', true],
];
for (const [test, isValid] of isFloat) {
	tsts(`somewhatSafe.float.is(${test})`, () => {
		if (isValid) {
			assert.not.throws(() => somewhatSafe.float.is(test));
		} else {
			assert.throws(() => somewhatSafe.float.is(test));
		}
	});
}

const floatCoerceSet: [unknown, number][] = [
	['', 0],
	['1', 1],
	[1.9, 1.9],
	[true, 1],
	[123, 123],
];
for (const [input, expect] of floatCoerceSet) {
	tsts(`somewhatSafe.float.coerce(${input})`, () => {
		assert.is(expect, somewhatSafe.float.coerce(input));
	});
}

const isString: [unknown, boolean][] = [
	[undefined, true],
	[null, true],
	//[Symbol('nope'),false],
	[true, true],
	[0, true],
	[1.1, true],

	['yep', true],
	['', true],
];
for (const [test, isValid] of isString) {
	tsts(`safe.string.is(${test})`, () => {
		if (isValid) {
			assert.not.throws(() => somewhatSafe.string.is(test));
		} else {
			assert.throws(() => somewhatSafe.string.is(test));
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
		assert.is(somewhatSafe.string.nullEmpty(test), expect);
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
			assert.not.throws(()=>somewhatSafe.len.atLeast('$noun',test,need));
		});	
	} else {
		tsts(`safe.len.atLeast(${test},${need}) throws`, () => {
			assert.throws(()=>somewhatSafe.len.atLeast('$noun',test,need));
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
			assert.not.throws(()=>somewhatSafe.len.exactly('$noun',test,need));
		})
	} else {
		tsts(`safe.len.exactly(${test},${need}) throws`,()=>{
			assert.throws(()=>somewhatSafe.len.exactly('$noun',test,need));
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
			assert.not.throws(()=>somewhatSafe.float.zeroTo('$noun',test,5));
		})
	} else {
		tsts(`safe.float.zeroTo(${test},5) throws`,()=>{
			assert.throws(()=>somewhatSafe.float.zeroTo('$noun',test,5));
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
			assert.not.throws(()=>somewhatSafe.float.lt('$noun',test,5));
		})
	} else {
		tsts(`safe.float.lt(${test},5) throws`,()=>{
			assert.throws(()=>somewhatSafe.float.lt('$noun',test,5));
		})
	}
}

tsts.run();
