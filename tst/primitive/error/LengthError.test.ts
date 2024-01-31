import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { LengthError } from '../../../src/primitive/error/LengthError';

const tsts = suite('LengthError');
//While these are rigid we need to make sure the error message is reasonable

const arg2Set: [number, number, string][] = [
    [0 , 1,"Invalid length; need 0, have 1"],
    [88, 2,"Invalid length; need 88, have 2"],
];
for (const [need, available, expect] of arg2Set) {
	tsts(`LengthError(${need},${available})`, () => {
		const c = new LengthError(need,available);
		assert.is(c.message, expect, 'message');
		assert.is(c.need, need, 'need');
        assert.is(c.key, 'length', 'name');
		assert.is(c.available, available, 'available');
	});
}

const arg3Set:[number,string,number,string][]=[
    [0,"herp",1,"Invalid herp; need 0, have 1"],
    [88,"herp",2,"Invalid herp; need 88, have 2"],
]
for (const [need, name, available, expect] of arg3Set) {
	tsts(`LengthError(${need},${name},${available})`, () => {
		const c = new LengthError(need,name,available);
		assert.is(c.message, expect, 'message');
		assert.is(c.need, need, 'need');
        assert.is(c.key, name, 'name');
		assert.is(c.available, available, 'available');
	});
}

const atMostSet:[number,string,number,string][]=[
    [10,"bottles",12,"Invalid bottles; need <=10, have 12"],
];
for (const [need, name, available, expect] of atMostSet) {
	tsts(`atMost(${need},${name},${available})`, () => {
		const c = LengthError.atMost(need,name,available);
		assert.is(c.message, expect, 'message');
		assert.is(c.need, need, 'need');
        assert.is(c.key, name, 'name');
		assert.is(c.available, available, 'available');
	});
}

const mulOfSet:[number,string,number,string][]=[
    [3,"$$name",13,"Invalid $$name; need multiple of 3, have 13"],
];
for (const [need, name, available, expect] of mulOfSet) {
	tsts(`mulOf(${need},${name},${available})`, () => {
		const c = LengthError.mulOf(need,name,available);
		assert.is(c.message, expect, 'message');
		assert.is(c.need, need, 'need');
        assert.is(c.key, name, 'name');
		assert.is(c.available, available, 'available');
	});
}

const oneOfSet:[number[],string,number,string][]=[
    [[1,2,3],"$$name",13,"Invalid $$name; need one of 1,2,3, have 13"],
];
for (const [needs, name, available, expect] of oneOfSet) {
	tsts(`oneOf(${needs},${name},${available})`, () => {
		const c = LengthError.oneOf(needs,name,available);
		assert.is(c.message, expect, 'message');
		//assert.is(c.need, needs, 'need');/need only gets set to the last value, not very helpful
        assert.is(c.key, name, 'name');
		assert.is(c.available, available, 'available');
	});
}

tsts('name', () => {
    const o=new LengthError(3,1);
	assert.is(o.name, 'LengthError');
});

tsts('[Symbol.toStringTag]', () => {
    const o=new LengthError(3,1);
	const str = Object.prototype.toString.call(o);
	assert.is(str.indexOf('LengthError') > 0, true);
});

// const arg3Set: [string, string, unknown, string][] = [
// 	[
// 		'$${reason}',
// 		'$${key}',
// 		'$${value}',
// 		'Invalid $${key}; $${reason} ($${value})',
// 	],
//     [
// 		'HerpyDerp',
// 		'logic',
// 		false,
// 		'Invalid logic; HerpyDerp (false)',
// 	],
// ];
// for (const [reason, key, value, expect] of arg3Set) {
// 	tsts(`ContentError(${reason},${key},${value})`, () => {
// 		const c = new ContentError(reason, key, value);
// 		assert.is(c.message, expect, 'message');
// 		assert.is(c.reason, reason, 'reason');
// 		assert.is(c.key, key, 'key');
// 		assert.is(c.value, value, 'value');
// 	});
// }
tsts.run();
