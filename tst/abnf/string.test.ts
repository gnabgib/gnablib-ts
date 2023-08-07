import { suite } from 'uvu';
import { BnfChar, BnfString } from '../../src/abnf';
import * as assert from 'uvu/assert';
import { WindowStr } from '../../src/primitive';

const tsts = suite('ABNF string');

const testString: {
	str: string | BnfChar[];
	caseInsensitive: boolean | undefined;
	expectedStr: string;
	expectedCI: boolean | undefined | 'mix';
}[] = [
	//All one type
	{ str: 'ab', caseInsensitive: true, expectedStr: '"ab"/i', expectedCI: true }, //Note we flag insensitive
	{ str: 'ab', caseInsensitive: false, expectedStr: '"ab"', expectedCI: false },
	//All undefined
	{
		str: '01',
		caseInsensitive: true,
		expectedStr: '"01"',
		expectedCI: undefined,
	},
	{
		str: '01',
		caseInsensitive: false,
		expectedStr: '"01"',
		expectedCI: undefined,
	},
	//All undefined/one type
	{
		str: 'a01',
		caseInsensitive: true,
		expectedStr: '"a01"/i',
		expectedCI: true,
	},
	{
		str: 'a01',
		caseInsensitive: false,
		expectedStr: '"a01"',
		expectedCI: false,
	},
	//Ctrl characters (undefined)
	{
		str: '\r\n',
		caseInsensitive: true,
		expectedStr: '%x0D.0A',
		expectedCI: undefined,
	},
	{
		str: '\r\n',
		caseInsensitive: false,
		expectedStr: '%x0D.0A',
		expectedCI: undefined,
	},
	//Mixed ctrl and one type
	{
		str: 'a\tb',
		caseInsensitive: true,
		expectedStr: '%x61.09.62/i',
		expectedCI: true,
	},
	{
		str: 'a\tb',
		caseInsensitive: false,
		expectedStr: '%x61.09.62',
		expectedCI: false,
	},
	//Mixed s/i
	{
		str: [new BnfChar('A', false), new BnfChar('b', true)],
		caseInsensitive: true,
		expectedStr: '("A" "b"/i)',
		expectedCI: 'mix',
	},
	{
		str: [new BnfChar('A', false), new BnfChar('b', true)],
		caseInsensitive: false,
		expectedStr: '("A" "b"/i)',
		expectedCI: 'mix',
	},
	//Mixed s/i/ctrl
	{
		str: [new BnfChar('A', false), new BnfChar('\t'), new BnfChar('b', true)],
		caseInsensitive: true,
		expectedStr: '("A" %x09 "b"/i)',
		expectedCI: 'mix',
	},
];
for (const { str, caseInsensitive, expectedStr, expectedCI } of testString) {
	tsts(`String(${str},${caseInsensitive}) - sens+str:`, () => {
		const s = new BnfString(str, caseInsensitive);
		assert.is(s.caseInsensitive, expectedCI);
		assert.is('' + s, expectedStr);
	});
}

const testStringDescr: {
	str: string;
	descr: string;
}[] = [
	{ str: 'Hello', descr: '"Hello"' },
	{ str: '\r\n', descr: '%x0D.0A' },
];
for (const { str, descr } of testStringDescr) {
	tsts(`String(${str}).descr():`, () => {
		const s = new BnfString(str);
		assert.is(s.descr(), descr);
	});
}

const testMatch: {
	haystack: string;
	needle: string;
	CI?: boolean;
	expectRem?: string;
	expectMatch?: string;
}[] = [
	{ haystack: 'Hello', needle: 'el' }, //Not at the beginning
	{ haystack: 'Hello', needle: 'He', expectRem: 'llo', expectMatch: 'He' },
	{ haystack: 'Hello', needle: 'Hell', expectRem: 'o', expectMatch: 'Hell' },
	{
		haystack: 'Hello',
		CI: false,
		needle: 'Hell',
		expectRem: 'o',
		expectMatch: 'Hell',
	},
	{ haystack: 'Hello', needle: 'HELL', expectRem: 'o', expectMatch: 'Hell' },
	{ haystack: 'HeLlo', needle: 'HELL', expectRem: 'o', expectMatch: 'HeLl' },
	{ haystack: 'Hello', CI: false, needle: 'HELL' }, //case sensitive match
];
for (const { haystack, needle, CI, expectRem, expectMatch } of testMatch) {
	tsts(`String(${needle}).atStartOf(${haystack}):`, () => {
		const c = new BnfString(needle, CI);
		const w = new WindowStr(haystack);
		const m = c.atStartOf(w);
		if (expectRem !== undefined) {
			assert.is(m.fail, false);
			assert.is(m.remain?.toString(), expectRem);
			assert.is(m.result?.value.toString(), expectMatch);
		} else {
			assert.is(m.fail, true);
		}
	});
}

tsts('Fragile[debug] tests:', () => {
	const str = new BnfString('gnabgib');
	// Using /i from regex to indicate case insensitivity (the alternatives would be regex
	// sets [Gg] or some other notation?)
	assert.is(String(str), '"gnabgib"/i', 'Coerce to string via concat');
});

tsts.run();
