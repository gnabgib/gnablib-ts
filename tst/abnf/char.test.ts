import { suite } from 'uvu';
import { BnfChar } from '../../src/abnf';
import * as assert from 'uvu/assert';
import { WindowStr } from '../../src/primitive';

const tsts = suite('ABNF char');

const validBuildTests: {
	chr: string;
	ord: number;
	caseInsensitive: boolean | undefined;
}[] = [
	{ chr: '!', ord: 33, caseInsensitive: undefined },
	{ chr: ' ', ord: 32, caseInsensitive: undefined },
	{ chr: '$', ord: 0x24, caseInsensitive: undefined },
	{ chr: '£', ord: 0xa3, caseInsensitive: undefined },
	{ chr: 'ह', ord: 0x939, caseInsensitive: undefined },
	{ chr: '€', ord: 0x20ac, caseInsensitive: undefined },
	{ chr: '한', ord: 0xd55c, caseInsensitive: undefined },
	//JS uses UTF-16, so cannot represent this 32bit unicode char
	//['𐍈',0x10348],
	//Nor this emoji
	//['😄',0x1f604],
];
for (const { chr, ord, caseInsensitive } of validBuildTests) {
	tsts(`Char('${chr}'):`, () => {
		const c = new BnfChar(chr);
		assert.is(c.chr, chr);
		assert.is(c.ord, ord);
		assert.is(c.caseInsensitive, caseInsensitive);
	});
	tsts(`Char(${ord}):`, () => {
		const c = new BnfChar(ord);
		assert.is(c.chr, chr);
		assert.is(c.ord, ord);
		assert.is(c.caseInsensitive, caseInsensitive);
	});
}

const charSensitiveTests: {
	chr: string | BnfChar;
	insensitive: boolean | undefined;
	expectedStr: string;
	expectedCI: boolean | undefined;
}[] = [
	//Valid sensitives
	{ chr: 'A', insensitive: undefined, expectedStr: '"A"', expectedCI: false },
	{ chr: 'A', insensitive: true, expectedStr: '"A"/i', expectedCI: true },
	{ chr: 'A', insensitive: false, expectedStr: '"A"', expectedCI: false },
	{ chr: 'a', insensitive: undefined, expectedStr: '"a"', expectedCI: false },
	{ chr: 'a', insensitive: true, expectedStr: '"a"/i', expectedCI: true },
	{ chr: 'a', insensitive: false, expectedStr: '"a"', expectedCI: false },
	//From a char - new insensitive overrides char if not undefined
	{
		chr: new BnfChar('A', undefined),
		insensitive: undefined,
		expectedStr: '"A"',
		expectedCI: false,
	},
	{
		chr: new BnfChar('A', undefined),
		insensitive: true,
		expectedStr: '"A"/i',
		expectedCI: true,
	},
	{
		chr: new BnfChar('A', undefined),
		insensitive: false,
		expectedStr: '"A"',
		expectedCI: false,
	},
	{
		chr: new BnfChar('A', true),
		insensitive: undefined,
		expectedStr: '"A"/i',
		expectedCI: true,
	},
	{
		chr: new BnfChar('A', true),
		insensitive: true,
		expectedStr: '"A"/i',
		expectedCI: true,
	},
	{
		chr: new BnfChar('A', true),
		insensitive: false,
		expectedStr: '"A"',
		expectedCI: false,
	},
	{
		chr: new BnfChar('A', false),
		insensitive: undefined,
		expectedStr: '"A"',
		expectedCI: false,
	},
	{
		chr: new BnfChar('A', false),
		insensitive: true,
		expectedStr: '"A"/i',
		expectedCI: true,
	},
	{
		chr: new BnfChar('A', false),
		insensitive: false,
		expectedStr: '"A"',
		expectedCI: false,
	},

	//Invalid (should override to undefined)
	{
		chr: '?',
		insensitive: undefined,
		expectedStr: '"?"',
		expectedCI: undefined,
	},
	{ chr: '?', insensitive: true, expectedStr: '"?"', expectedCI: undefined },
	{ chr: '?', insensitive: false, expectedStr: '"?"', expectedCI: undefined },
	{
		chr: '0',
		insensitive: undefined,
		expectedStr: '"0"',
		expectedCI: undefined,
	},
	{ chr: '0', insensitive: true, expectedStr: '"0"', expectedCI: undefined },
	{ chr: '0', insensitive: false, expectedStr: '"0"', expectedCI: undefined },
	{
		chr: '_',
		insensitive: undefined,
		expectedStr: '"_"',
		expectedCI: undefined,
	},
	{ chr: '_', insensitive: true, expectedStr: '"_"', expectedCI: undefined },
	{ chr: '_', insensitive: false, expectedStr: '"_"', expectedCI: undefined },
	{
		chr: '~',
		insensitive: undefined,
		expectedStr: '"~"',
		expectedCI: undefined,
	},
	{ chr: '~', insensitive: true, expectedStr: '"~"', expectedCI: undefined },
	{ chr: '~', insensitive: false, expectedStr: '"~"', expectedCI: undefined },
	{
		chr: '/',
		insensitive: undefined,
		expectedStr: '"/"',
		expectedCI: undefined,
	},
	{ chr: '/', insensitive: true, expectedStr: '"/"', expectedCI: undefined },
	{ chr: '/', insensitive: false, expectedStr: '"/"', expectedCI: undefined },
];
for (const {
	chr,
	insensitive,
	expectedStr,
	expectedCI,
} of charSensitiveTests) {
	tsts(`Char(${chr},${insensitive}) - sens+str:`, () => {
		const c = new BnfChar(chr, insensitive);
		assert.is(c.caseInsensitive, expectedCI, 'CI match');
		assert.is('' + c, expectedStr, 'Debug match');
	});
}

const invalidBuildTests = [
	undefined,
	null,
	'',
	'this is a string',
	//Emoji are >1 char
	'🌝',
];
for (const chr of invalidBuildTests) {
	tsts(`invalid Char('${chr}'):`, () => {
		assert.throws(() => new BnfChar(chr));
	});
}

const testDescr = [
	['!', '"!"'],
	['\x00', '%x00'],
];
for (const [char, descr] of testDescr) {
	tsts(`Char(${char}).descr():`, () => {
		const c = new BnfChar(char);
		assert.is(c.descr(), descr);
	});
}

const testMatch: {
	haystack: string;
	needle: string;
	CI?: boolean;
	expectRem?: string;
	expectMatch?: string;
}[] = [
	{ haystack: 'Hello', needle: 'e' }, //Not at the beginning
	{ haystack: 'Hello', needle: 'H', expectRem: 'ello', expectMatch: 'H' },
	{ haystack: 'Hello', needle: 'h' },
	{ haystack: '$var', needle: 'v' },
	{ haystack: '$var', needle: '$', expectRem: 'var', expectMatch: '$' },
	{
		haystack: 'Hello',
		CI: true,
		needle: 'h',
		expectRem: 'ello',
		expectMatch: 'H',
	},
];
for (const { haystack, needle, CI, expectRem, expectMatch } of testMatch) {
	tsts(`Char(${needle}).atStartOf(${haystack}):`, () => {
		const c = new BnfChar(needle, CI);
		const w = new WindowStr(haystack);
		const m = c.atStartOf(w);
		if (expectRem !== undefined) {
			assert.is(m.fail, false);
			assert.is(m.remain?.toString(), expectRem);
			assert.is(m.result?.value.toString(), expectMatch);
		} else {
			assert.is(m.fail, true);
			//pos will always be 0
		}
	});
}

tsts('Fragile[debug] tests:', () => {
	const char = new BnfChar('a', true);
	assert.is(char.toString(), '"a"/i');
});

tsts.run();
