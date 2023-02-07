import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import {
	ReadonlyTyped,
	FixedTyped,
	FixedUint8Array,
	FixedUint16Array,
} from '../../src/primitive/TypedArrayExt';

const tsts = suite('FixedTyped');

const a = [17, 0, 1, 3, 5];
const a16 = new Uint16Array(a);
const f8 = new FixedUint8Array(new Uint8Array([0, 1, 3, 5]));
const f16 = new FixedUint16Array(new Uint16Array([0, 1, 3, 5]));
const f16Offset = new FixedUint16Array(a16, 1);

//Read tests (same as ReadonlyTyped, for now.. but regressions)

const buildTests: {
	buildLen: number | undefined;
	buildOffset: number | undefined;
	expectLen: number;
	atZero: number | undefined;
}[] = [
	{
		buildLen: undefined,
		buildOffset: undefined,
		expectLen: 5,
		atZero: 17,
	},
	{
		buildLen: undefined,
		buildOffset: 1,
		expectLen: 4,
		atZero: 0,
	},
	{
		buildLen: 4,
		buildOffset: 1,
		expectLen: 4,
		atZero: 0,
	},
	{
		buildLen: 3,
		buildOffset: 1,
		expectLen: 3,
		atZero: 0,
	},
	{
		buildLen: 2,
		buildOffset: 1,
		expectLen: 2,
		atZero: 0,
	},
	{
		buildLen: 1,
		buildOffset: 1,
		expectLen: 1,
		atZero: 0,
	},
	{
		buildLen: 1,
		buildOffset: 2,
		expectLen: 1,
		atZero: 1,
	},
	{
		buildLen: 0,
		buildOffset: 1,
		expectLen: 0,
		atZero: undefined,
	},
];
for (const test of buildTests) {
	tsts(`constructor(F16,${test.buildOffset}:${test.buildLen}):`, () => {
		const tmp = new FixedUint16Array(a16, test.buildOffset, test.buildLen);
		assert.instance(tmp, FixedUint16Array);
		assert.is(tmp.length, test.expectLen, 'length');
		assert.is(tmp.BYTES_PER_ELEMENT, 2, 'bytes per element');
		assert.is(tmp[0], test.atZero, '[0]');

		//Always 2* because 2 bytes/el
		assert.is(tmp.byteOffset, (test.buildOffset ?? 0) * 2, 'byteOffset');
		assert.is(tmp.byteLength, test.expectLen * 2, 'byteLength');

		//Cap is the same as length
		assert.is(tmp.capacity, test.expectLen, 'capacity');
	});
}

tsts('at(2):', () => {
	assert.is(f8.at(2), 3);
	assert.is(f16Offset.at(2), 3);
	assert.is(f16.at(2), 3);
});

tsts('clone (does a memory copy):', () => {
	//Changing values of the cone doesn't change the original
	const clone8 = f8.clone();
	clone8[2] = 17;
	assert.is(f8[2], 3);
	assert.is(clone8[2], 17);
});

tsts('entries:', () => {
	let sum = 0;
	for (const pair of f8.entries()) {
		sum += pair[1];
		//Demonstrate the memory isn't shared
		pair[1] = 17;
	}
	assert.is(f8[2], 3);
	assert.is(sum, 9);
});

function lt10(value: number, index: number): boolean {
	const ret = value < 10;
	//Demonstrate the memory isn't shared
	value = 17;
	return ret;
}

function gt2(value: number, index: number): boolean {
	const ret = value > 2;
	value = 17;
	return ret;
}

function gt10(value: number, index: number): boolean {
	return value > 10;
}

function mutateCallback(value: number, index: number): boolean {
	//Demonstrate the memory isn't shared
	index = 42;
	value = 17;
	//this[2]=17;
	return true;
}

//Unfortunately the type safety of typescript, which will say we cannot do this (ts2345):
//   r8.every(badMutateCallback);
//Can be overridden by ignoring the complaint, or using JS
//   console.log(r8[2]);// 17

function badMutateCallback(
	value: number,
	index: number,
	arr: Uint8Array
): boolean {
	arr[index] = 17;
	return true;
}
function square(value: number, index: number): number {
	return value * value;
}

tsts('every (value<10):', () => {
	assert.is(f8.every(lt10), true);
	assert.is(f8[2], 3);

	assert.is(f16Offset.every(lt10), true);

	assert.is(f16.every(lt10), true);
});

tsts("every (doesn't mutate):", () => {
	f8.every(mutateCallback);
	// @ts-expect-error: ts2345 is expected, we're making sure we cannot get around by ignoring
	assert.throws(() => f8.every(badMutateCallback));
	assert.is(f8[2], 3);
});

tsts('filter (value>2):', () => {
	const res = f8.filter(gt2);
	assert.is(res.length, 2, 'Two elements are found >2');
	assert.is(f8[2], 3);

	assert.is(f16Offset.filter(gt2).length, 2);

	assert.is(f16.filter(gt2).length, 2);
});

tsts("filter (doesn't mutate):", () => {
	f8.filter(mutateCallback);
	// @ts-expect-error: ts2345 is expected, we're making sure we cannot get around by ignoring
	assert.throws(() => f8.filter(badMutateCallback));
	assert.is(f8[2], 3);
});

tsts('find (value>2):', () => {
	//First value >2 is 3
	assert.is(f8.find(gt2), 3);
	assert.is(f8[2], 3);

	assert.is(f16Offset.find(gt2), 3);

	assert.is(f16.find(gt2), 3);
});

tsts("find (doesn't mutate):", () => {
	f8.find(mutateCallback);
	// @ts-expect-error: ts2345 is expected, we're making sure we cannot get around by ignoring
	assert.throws(() => f8.find(badMutateCallback));
	assert.is(f8[2], 3);
});

tsts('findIndex (value>2):', () => {
	//First value >2 is 3@2
	assert.is(f8.findIndex(gt2), 2);
	assert.is(f8[2], 3);

	assert.is(f16Offset.findIndex(gt2), 2);

	assert.is(f16.findIndex(gt2), 2);
});

tsts("findIndex (doesn't mutate):", () => {
	f8.findIndex(mutateCallback);
	// @ts-expect-error: ts2345 is expected, we're making sure we cannot get around by ignoring
	assert.throws(() => f8.findIndex(badMutateCallback));
	assert.is(f8[2], 3);
});

tsts('forEach:', () => {
	//This is a terrible way to count, but it shows we at least visited the right number of elements
	let count = 0;
	let sum = 0;
	const each = (v: number, i: number) => {
		count++;
		sum += v;
	};

	f8.forEach(each);
	assert.is(count, 4);
	assert.is(sum, 9);

	count = 0;
	sum = 0;
	f16Offset.forEach(each);
	assert.is(count, 4);
	assert.is(sum, 9);

	count = 0;
	sum = 0;
	f16.forEach(each);
	assert.is(count, 4);
	assert.is(sum, 9);
});

tsts("forEach (doesn't mutate):", () => {
	f8.forEach(mutateCallback);
	// @ts-expect-error: ts2345 is expected, we're making sure we cannot get around by ignoring
	assert.throws(() => f8.forEach(badMutateCallback));
	assert.is(f8[2], 3);
});

// tsts('forEach with array access:',()=>{
//     //How to still access array even though it's not provided in the action
//     r8.forEach(function (v,i) {console.log(v,this[3-i]);},r8)
//    // But not you cannot use FAT ARROW since this will be pre bound
//    //r8.forEach((v,i) =>console.log(v,i,this[i]),r8)
// });

tsts('includes (1):', () => {
	// 1@1
	assert.is(f8.includes(1), true);
	assert.is(f8.includes(1, 1), true); //Note second arg is from-inclusive (so still found)
	assert.is(f8.includes(1, 2), false);

	assert.is(f16Offset.includes(1), true);
	assert.is(f16Offset.includes(1, 2), false);

	assert.is(f16.includes(1), true);
	assert.is(f16.includes(1, 2), false);
});

tsts('indexOf (1):', () => {
	// 1@1
	assert.is(f8.indexOf(1), 1);
	assert.is(f8.indexOf(1, 1), 1); //Note second arg is from-inclusive (so still found)
	assert.is(f8.indexOf(1, 2), -1);
	assert.is(f8.indexOf(17), -1);

	assert.is(f16Offset.indexOf(1), 1);
	assert.is(f16Offset.indexOf(1, 2), -1);
	assert.is(f16Offset.indexOf(17), -1);

	assert.is(f16.indexOf(1), 1);
	assert.is(f16.indexOf(1, 2), -1);
	assert.is(f16.indexOf(17), -1);
});

tsts('join:', () => {
	assert.is(f8.join(), '0,1,3,5');
	assert.is(f16Offset.join(), '0,1,3,5');
	assert.is(f16.join(), '0,1,3,5');
});

tsts('keys:', () => {
	const indexes = [0, 1, 2, 3];
	//is would check memory address, so we need to do a deep-equal here
	//https://github.com/lukeed/uvu/blob/HEAD/docs/api.assert.md#equalactual-t-expects-t-msg-message
	assert.equal(Array.from(f8.keys()), indexes);
	assert.equal(Array.from(f16Offset.keys()), indexes);
	assert.equal(Array.from(f16.keys()), indexes);
});

tsts('lastIndexOf (3):', () => {
	// 3@2
	// This 3 hours to debug: TS bug
	assert.is(f8.lastIndexOf(3), 2);
	assert.is(f8.lastIndexOf(3, 2), 2); //Note second arg is from-inclusive (so still found)
	assert.is(f8.lastIndexOf(3, 1), -1);
	assert.is(f8.lastIndexOf(17), -1);

	assert.is(f16Offset.indexOf(1), 1);
	assert.is(f16Offset.indexOf(1, 2), -1);
	assert.is(f16Offset.indexOf(17), -1);

	assert.is(f16.lastIndexOf(3), 2);
	assert.is(f16.indexOf(1, 2), -1);
	assert.is(f16.indexOf(17), -1);
});

tsts('map:', () => {
	const squares = [0, 1, 9, 25];
	assert.equal(Array.from(f8.map(square).values()), squares);
	assert.equal(Array.from(f16Offset.map(square).values()), squares);
	assert.equal(Array.from(f16.map(square).values()), squares);
});

tsts("map (doesn't mutate):", () => {
	// @ts-expect-error: ts2345 is expected, we're making sure we cannot get around by ignoring
	assert.throws(() => f8.map(badMutateCallback));
	//r8.map(badMutateCallback)
	assert.is(f8[2], 3);
});

tsts('some:', () => {
	assert.equal(f8.some(gt2), true);
	assert.equal(f8.some(gt10), false);
	assert.equal(f16Offset.some(gt2), true);
	assert.equal(f16.some(gt2), true);
});

tsts('readonlySpan:', () => {
	var r8b = f8.readonlySpan();
	assert.is.not(f8, r8b, 'Different memory structures (the readonly part)');
	assert.instance(r8b, ReadonlyTyped<Uint8Array>);
	assert.equal(f8.values(), r8b.values(), 'Same content');
});

tsts('values:', () => {
	const values = [0, 1, 3, 5];
	assert.equal(Array.from(f8.values()), values);
	assert.equal(Array.from(f16Offset.values()), values);
	assert.equal(Array.from(f16.values()), values);
});

tsts('toString:', () => {
	assert.is(f8.toString(), f8.join());
	assert.is(f16Offset.toString(), f16Offset.join());
	assert.is(f16.toString(), f16.join());
});

tsts('toJSON:', () => {
	const values = [0, 1, 3, 5];
	assert.equal(f8.toJSON(), values);
	assert.equal(f16Offset.toJSON(), values);
	assert.equal(f16.toJSON(), values);
});

tsts('[Symbol.iterator]:', () => {
	const values = [0, 1, 3, 5];
	assert.equal(Array.from(f8), values);
	assert.equal(Array.from(f16Offset), values);
	assert.equal(Array.from(f16), values);
});

tsts('[Symbol.toStringTag]:', () => {
	const str = Object.prototype.toString.call(f8); //Fixed<Uint8Array>
	assert.is(str.indexOf('Fixed') > 0, true);
});

//Write tests

tsts('setEl:', () => {
	const f = new FixedUint16Array(new Uint16Array(a));
	assert.is(f[0], 17);
	assert.is(f[1], 0);
	f[0] = 99;
	f.setEl(1, 11);
	assert.is(f[0], 99);
	assert.is(f[1], 11);
});

tsts('fill:', () => {
	const f = new FixedUint16Array(new Uint16Array(a));
	assert.is(f.join(), '17,0,1,3,5');
	f.fill(11, 2);
	assert.is(f.join(), '17,0,11,11,11');
	f.fill(0, 1, 3);
	assert.is(f.join(), '17,0,0,0,11');
	f.fill(1);
	assert.is(f.join(), '1,1,1,1,1');
	f.fill(2, 1);
	assert.is(f.join(), '1,2,2,2,2');
	f.fill(3, -1);
	assert.is(f.join(), '1,2,2,2,3');
	f.fill(4, -1, -1);
	assert.is(f.join(), '1,2,2,2,3');
	f.fill(99, 100);
	assert.is(f.join(), '1,2,2,2,3');
	f.fill(98, -6, 7);
	assert.is(f.join(), '1,2,2,2,3');
});

tsts('reverse:', () => {
	const f = new FixedUint16Array(new Uint16Array(a));
	assert.is(f.join(), '17,0,1,3,5');
	f.reverse();
	assert.is(f.join(), '5,3,1,0,17');
});

tsts('set:', () => {
	const f = new FixedUint16Array(new Uint16Array(a));
	assert.is(f.join(), '17,0,1,3,5');
	f.set([1, 2, 3, 4]);
	assert.is(f.join(), '1,2,3,4,5');
	f.set([17, 18], 2);
	assert.is(f.join(), '1,2,17,18,5');
});

tsts('sort:', () => {
	const f = new FixedUint16Array(new Uint16Array(a));
	assert.is(f.join(), '17,0,1,3,5');
	f.sort((a, b) => b - a); //descending
	assert.is(f.join(), '17,5,3,1,0');
	f[3] = 99;
	f.sort(); //ascending
	assert.is(f.join(), '0,3,5,17,99');
});

tsts('span:', () => {
	const f = new FixedUint16Array(new Uint16Array(a));
	assert.is(f.join(), '17,0,1,3,5', 'baseline');
	const fb = f.span(1, 3);
	assert.is(fb.join(), '0,1,3', 'span');
	assert.instance(fb, FixedTyped<Uint16Array>);
	assert.is(fb.length, 3);
	fb[0] = 18; //Because f & fb show this element it mutates both arrays
	f[0] = 22; //Only f has this element so it only changes one array
	assert.is(f.join(), '22,18,1,3,5');
	assert.is(fb.join(), '18,1,3');
});

tsts.run();
