import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Bool } from '../../src/primitive/Bool';
import { BitWriter } from '../../src/primitive/BitWriter';
import { hex } from '../../src/codec';
import { BitReader } from '../../src/primitive/BitReader';
import util from 'util';
import { WindowStr } from '../../src/primitive/WindowStr';
import { ParseProblem } from '../../src/error';

const tsts = suite('Bool');

const t = Bool.from(true);
const f = Bool.from(false);

const from_tests: [boolean | number, boolean][] = [
	[0, false],
	[1, true],
	[-1, true],
	[false, false],
	[true, true],

	//Since we can't avoid FP numbers.. let's check they follow reasonable rules
	[1.1, true],
	[0.001, true],
	[Number.NaN, false],
	[Number.POSITIVE_INFINITY, true],
	[Number.NEGATIVE_INFINITY, true],
];
for (const [v, expect] of from_tests) {
	tsts(`from(${v})`, () => {
		const o = Bool.from(v);
		assert.is(o.valueOf(), expect);
	});
}

tsts(`mount`, () => {
	const b = new Uint8Array(2);
	assert.is(hex.fromBytes(b), '0000');
	const o = Bool.mount(b, 1);
	assert.is(o.valueOf(), false);
	b[1] = 0b1;
	assert.is(o.valueOf(), true, 'updating underlying byte changes value');
	b[1] = 0b10;
	assert.is(
		o.valueOf(),
		false,
		'only the lowest bit of the byte effects value'
	);
	b[0] = 0b1;
	assert.is(o.valueOf(), false, 'other bytes are ignored');
});

const serial_tests: [boolean, number][] = [
	[true, 0x80],
	[false, 0],
];
for (const [v, ser] of serial_tests) {
	tsts(`serial(${v})`, () => {
		const b = new Uint8Array(1);
		const bw = BitWriter.mount(b);
		const o = Bool.from(v);
		assert.is(b[0], 0);
		o.serial(bw);
		assert.is(b[0], ser);
	});
	tsts(`deserial(${ser})`, () => {
		const b = Uint8Array.of(ser);
		const br = BitReader.mount(b);
		const o = Bool.deserial(br);
		assert.is(o.valueOf(), v);
	});
}

tsts(`clone`, () => {
	const t2 = t.clone();
	assert.is.not(t, t2, 'not the same object');
	assert.equal(t, t2, 'same content');
});

tsts(`toString`, () => {
	assert.is(t.toString(), 'true');
	assert.is(f.toString(), 'false');
});

tsts(`valueOf`, () => {
	assert.is(t.valueOf(), true);
	assert.is(f.valueOf(), false);
});

tsts(`coercions`, () => {
	assert.is(`${t}`, 'true', 'string coerce');
	assert.is(`${f}`, 'false', 'string coerce');

	assert.is(+t, 1, 'number coerce');
	assert.is(+f, 0, 'number coerce');

	assert.is('' + t, 'true', 'default coerce');
	assert.is('' + f, 'false', 'default coerce');
});

tsts('[Symbol.toStringTag]', () => {
	const str = Object.prototype.toString.call(t);
	assert.is(str.indexOf('Bool') > 0, true);
});

tsts('util.inspect', () => {
	const u = util.inspect(t);
	assert.is(u.startsWith('Bool('), true);
});

const parse_tests: [string, boolean?][] = [
	[''],
	['tea'],

	['true', true],
	['1', true],
	['on'],
	['yes'],
	['     true\n', true],

	['false', false],
    ['FAlSE', false],
	['0', false],
	['off'],
	['no'],
];
for (const [str, expect] of parse_tests) {
	const ws = WindowStr.new(str);
	tsts(`parse(${str})`, () => {
		const r = Bool.parse(ws);
		if (expect === undefined) {
			assert.instance(r, ParseProblem);
		} else {
			assert.equal(r, expect);
		}
	});
}
const parse_plusYes_tests: [string, boolean?][] = [
	[''],
	['tea'],

	['true', true],
	['1', true],
	['on'],
	['yes', true],

	['false', false],
	['0', false],
	['off'],
	['no', false],
];
for (const [str, expect] of parse_plusYes_tests) {
	const ws = WindowStr.new(str);
	tsts(`parse(${str},{+yes})`, () => {
		const r = Bool.parse(ws, { allowYes: true });
		if (expect === undefined) {
			assert.instance(r, ParseProblem);
		} else {
			assert.equal(r, expect);
		}
	});
}
const parse_plusOn_tests: [string, boolean?][] = [
	[''],
	['tea'],

	['true', true],
	['1', true],
	['on', true],
	['yes'],

	['false', false],
	['0', false],
	['off', false],
	['no'],
];
for (const [str, expect] of parse_plusOn_tests) {
	const ws = WindowStr.new(str);
	tsts(`parse(${str},{+on})`, () => {
		const r = Bool.parse(ws, { allowOn: true });
		if (expect === undefined) {
			assert.instance(r, ParseProblem);
		} else {
			assert.equal(r, expect);
		}
	});
}
const parse_minusNumeric_tests: [string, boolean?][] = [
	[''],
	['tea'],

	['true', true],
	['1'],
	['on'],
	['yes'],

	['false', false],
	['0'],
	['off'],
	['no'],
];
for (const [str, expect] of parse_minusNumeric_tests) {
	const ws = WindowStr.new(str);
	tsts(`parse(${str},{-number})`, () => {
		const r = Bool.parse(ws, { preventNumeric: true });
		if (expect === undefined) {
			assert.instance(r, ParseProblem);
		} else {
			assert.equal(r, expect);
		}
	});
}

tsts.run();
