import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import {
	ReadonlyTyped,
	ReadonlyUint8Array,
	ReadonlyUint16Array,
} from '../../src/primitive';

const tsts = suite('ReadonlyTyped');

const a16 = new Uint16Array([17, 0, 1, 3, 5]);
const r8 = new ReadonlyUint8Array(new Uint8Array([0, 1, 3, 5]));
const r16 = new ReadonlyUint16Array(new Uint16Array([0, 1, 3, 5]));
const r8Offset = new ReadonlyUint8Array(new Uint8Array([0, 0, 1, 3, 5]), 1);

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
	tsts(`constructor(R16,${test.buildOffset}:${test.buildLen}):`, () => {
		const tmp = new ReadonlyUint16Array(a16, test.buildOffset, test.buildLen);
		assert.instance(tmp, ReadonlyUint16Array);
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
	assert.is(r8.at(2), 3);
	assert.is(r8Offset.at(2), 3);
	assert.is(r16.at(2), 3);
});

tsts('clone (does a memory copy):', () => {
	//Changing values of the cone doesn't change the original
	const clone8 = r8.clone();
	clone8[2] = 17;
	assert.is(r8[2], 3);
	assert.is(clone8[2], 17);
});

tsts('entries:', () => {
	let sum = 0;
	for (const pair of r8.entries()) {
		sum += pair[1];
		//Demonstrate the memory isn't shared
		pair[1] = 17;
	}
	assert.is(r8[2], 3);
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
	assert.is(r8.every(lt10), true);
	assert.is(r8[2], 3);

	assert.is(r8Offset.every(lt10), true);

	assert.is(r16.every(lt10), true);
});

tsts("every (doesn't mutate):", () => {
	r8.every(mutateCallback);
	// @ts-expect-error: ts2345 is expected, we're making sure we cannot get around by ignoring
	assert.throws(() => r8.every(badMutateCallback));
	assert.is(r8[2], 3);
});

tsts('filter (value>2):', () => {
	const res = r8.filter(gt2);
	assert.is(res.length, 2, 'Two elements are found >2');
	assert.is(r8[2], 3);

	assert.is(r8Offset.filter(gt2).length, 2);

	assert.is(r16.filter(gt2).length, 2);
});

tsts("filter (doesn't mutate):", () => {
	// deepcode ignore PureMethodReturnValueIgnored/test: whole point of the test
 r8.filter(mutateCallback);
	// @ts-expect-error: ts2345 is expected, we're making sure we cannot get around by ignoring
	assert.throws(() => r8.filter(badMutateCallback));
	assert.is(r8[2], 3);
});

tsts('find (value>2):', () => {
	//First value >2 is 3
	assert.is(r8.find(gt2), 3);
	assert.is(r8[2], 3);

	assert.is(r8Offset.find(gt2), 3);

	assert.is(r16.find(gt2), 3);
});

tsts("find (doesn't mutate):", () => {
	r8.find(mutateCallback);
	// @ts-expect-error: ts2345 is expected, we're making sure we cannot get around by ignoring
	assert.throws(() => r8.find(badMutateCallback));
	assert.is(r8[2], 3);
});

tsts('findIndex (value>2):', () => {
	//First value >2 is 3@2
	assert.is(r8.findIndex(gt2), 2);
	assert.is(r8[2], 3);

	assert.is(r8Offset.findIndex(gt2), 2);

	assert.is(r16.findIndex(gt2), 2);
});

tsts("findIndex (doesn't mutate):", () => {
	r8.findIndex(mutateCallback);
	// @ts-expect-error: ts2345 is expected, we're making sure we cannot get around by ignoring
	assert.throws(() => r8.findIndex(badMutateCallback));
	assert.is(r8[2], 3);
});

tsts('forEach:', () => {
	//This is a terrible way to count, but it shows we at least visited the right number of elements
	let count = 0;
	let sum = 0;
	const each = (v: number, i: number) => {
		count++;
		sum += v;
	};

	r8.forEach(each);
	assert.is(count, 4);
	assert.is(sum, 9);

	count = 0;
	sum = 0;
	r8Offset.forEach(each);
	assert.is(count, 4);
	assert.is(sum, 9);

	count = 0;
	sum = 0;
	r16.forEach(each);
	assert.is(count, 4);
	assert.is(sum, 9);
});

tsts("forEach (doesn't mutate):", () => {
	r8.forEach(mutateCallback);
	// @ts-expect-error: ts2345 is expected, we're making sure we cannot get around by ignoring
	assert.throws(() => r8.forEach(badMutateCallback));
	assert.is(r8[2], 3);
});

// tsts('forEach with array access:',()=>{
//     //How to still access array even though it's not provided in the action
//     r8.forEach(function (v,i) {console.log(v,this[3-i]);},r8)
//    // But not you cannot use FAT ARROW since this will be pre bound
//    //r8.forEach((v,i) =>console.log(v,i,this[i]),r8)
// });

tsts('includes (1):', () => {
	// 1@1
	assert.is(r8.includes(1), true);
	assert.is(r8.includes(1, 1), true); //Note second arg is from-inclusive (so still found)
	assert.is(r8.includes(1, 2), false);

	assert.is(r8Offset.includes(1), true);
	assert.is(r8Offset.includes(1, 2), false);

	assert.is(r16.includes(1), true);
	assert.is(r16.includes(1, 2), false);
});

tsts('indexOf (1):', () => {
	// 1@1
	assert.is(r8.indexOf(1), 1);
	assert.is(r8.indexOf(1, 1), 1); //Note second arg is from-inclusive (so still found)
	assert.is(r8.indexOf(1, 2), -1);
	assert.is(r8.indexOf(17), -1);

	assert.is(r8Offset.indexOf(1), 1);
	assert.is(r8Offset.indexOf(1, 2), -1);
	assert.is(r8Offset.indexOf(17), -1);

	assert.is(r16.indexOf(1), 1);
	assert.is(r16.indexOf(1, 2), -1);
	assert.is(r16.indexOf(17), -1);
});

tsts('join:', () => {
	assert.is(r8.join(), '0,1,3,5');
	assert.is(r8Offset.join(), '0,1,3,5');
	assert.is(r16.join(), '0,1,3,5');
});

tsts('keys:', () => {
	const indexes = [0, 1, 2, 3];
	//is would check memory address, so we need to do a deep-equal here
	//https://github.com/lukeed/uvu/blob/HEAD/docs/api.assert.md#equalactual-t-expects-t-msg-message
	assert.equal(Array.from(r8.keys()), indexes);
	assert.equal(Array.from(r8Offset.keys()), indexes);
	assert.equal(Array.from(r16.keys()), indexes);
});

tsts('lastIndexOf (3):', () => {
	// 3@2
	// This 3 hours to debug: TS bug
	assert.is(r8.lastIndexOf(3), 2);
	assert.is(r8.lastIndexOf(3, 2), 2); //Note second arg is from-inclusive (so still found)
	assert.is(r8.lastIndexOf(3, 1), -1);
	assert.is(r8.lastIndexOf(17), -1);

	assert.is(r8Offset.indexOf(1), 1);
	assert.is(r8Offset.indexOf(1, 2), -1);
	assert.is(r8Offset.indexOf(17), -1);

	assert.is(r16.lastIndexOf(3), 2);
	assert.is(r16.indexOf(1, 2), -1);
	assert.is(r16.indexOf(17), -1);
});

tsts('map:', () => {
	const squares = [0, 1, 9, 25];
	assert.equal(Array.from(r8.map(square).values()), squares);
	assert.equal(Array.from(r8Offset.map(square).values()), squares);
	assert.equal(Array.from(r16.map(square).values()), squares);
});

tsts("map (doesn't mutate):", () => {
	// @ts-expect-error: ts2345 is expected, we're making sure we cannot get around by ignoring
	assert.throws(() => r8.map(badMutateCallback));
	//r8.map(badMutateCallback)
	assert.is(r8[2], 3);
});

tsts('some:', () => {
	assert.equal(r8.some(gt2), true);
	assert.equal(r8.some(gt10), false);
	assert.equal(r8Offset.some(gt2), true);
	assert.equal(r16.some(gt2), true);
});

tsts("map (doesn't mutate):", () => {
	// @ts-expect-error: ts2345 is expected, we're making sure we cannot get around by ignoring
	assert.throws(() => r8.some(badMutateCallback));
	//r8.map(badMutateCallback)
	assert.is(r8[2], 3);
});

tsts('readonly:', () => {
	const r8b = r8.readonlySpan();
	assert.is.not(r8, r8b, 'Different memory structures (the readonly part)');
	assert.instance(r8b, ReadonlyTyped<Uint8Array>);
	assert.equal(r8.values(), r8b.values(), 'Same content');
});

tsts('values:', () => {
	const values = [0, 1, 3, 5];
	assert.equal(Array.from(r8.values()), values);
	assert.equal(Array.from(r8Offset.values()), values);
	assert.equal(Array.from(r16.values()), values);
});

tsts('toString:', () => {
	assert.is(r8.toString(), r8.join());
	assert.is(r8Offset.toString(), r8Offset.join());
	assert.is(r16.toString(), r16.join());
});

tsts('toJSON:', () => {
	const values = [0, 1, 3, 5];
	assert.equal(r8.toJSON(), values);
	assert.equal(r8Offset.toJSON(), values);
	assert.equal(r16.toJSON(), values);
});

tsts('[Symbol.iterator]:', () => {
	const values = [0, 1, 3, 5];
	assert.equal(Array.from(r8), values);
	assert.equal(Array.from(r8Offset), values);
	assert.equal(Array.from(r16), values);
});

tsts('[Symbol.toStringTag]:', () => {
	const str = Object.prototype.toString.call(r8); //Readonly<Uint8Array>
	assert.is(str.indexOf('Readonly') > 0, true);
});

tsts.run();
