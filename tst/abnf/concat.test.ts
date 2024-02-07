import { suite } from 'uvu';
import { BnfConcat, BnfChar, BnfString, BnfRange } from '../../src/abnf';
import * as assert from 'uvu/assert';
import { WindowStr } from '../../src/primitive/WindowStr';

const tsts = suite('ABNF concat');

const testConcatDescr: {
	items: Array<BnfChar | BnfRange | BnfString>;
	descr: string;
}[] = [
	{ items: [new BnfChar('h'), new BnfChar('i')], descr: '("h" "i")' }, //Single (collapsed) string isn't bracketed
	{
		items: [new BnfChar('h'), new BnfChar('i'), new BnfRange('0', '9')],
		descr: '("h" "i" "0"-"9")',
	},
	{
		items: [new BnfChar('h'), new BnfChar('i'), new BnfRange(0, 9)],
		descr: '("h" "i" %x00-09)',
	},
	{ items: [new BnfString('Hello')], descr: '"Hello"' },
];

for (const { items, descr } of testConcatDescr) {
	tsts(`Concat(${descr}).descr():`, () => {
		const c = new BnfConcat(...items);
		assert.is(c.descr(), descr);
	});
}

const testMatch: {
	haystack: string;
	needles: Array<BnfChar | BnfRange | BnfString>;
	//IF MATCH
	expectRem?: string; //Remaining string
	expectMatches: string[];
	//IF FAIL
	expectPos?: number; //Position of failure (if partial match)
}[] = [
	{
		haystack: 'Hello',
		needles: [new BnfString('Hey'), new BnfString('there')],
		expectPos: 0,
		expectMatches: [],
	},
	{
		haystack: 'Hi there',
		needles: [new BnfString('hi'), new BnfChar(' '), new BnfString('THERE')],
		expectRem: '',
		expectMatches: ['Hi', ' ', 'there'],
	},
	{
		haystack: 'Hi there2',
		needles: [new BnfString('hi'), new BnfString('THERE')],
		expectPos: 2,
		expectMatches: [],
	}, //Fails because there's no space allowed
];
for (const {
	haystack,
	needles,
	expectRem,
	expectPos,
	expectMatches,
} of testMatch) {
	tsts(`Concat().atStartOf(${haystack}):`, () => {
		const c = new BnfConcat(...needles);
		const w = WindowStr.new(haystack);
		const m = c.atStartOf(w);
		//console.log(m);
		if (expectRem !== undefined) {
			assert.is(m.fail, false);
			assert.is(m.remain?.toString(), expectRem);
			assert.is(m.result?.components?.length, expectMatches?.length);
			if (m.result?.components === undefined) {
				assert.is(true, false, 'Expecting components');
			} else {
				for (let i = 0; i < expectMatches.length; i++) {
					assert.equal(
						m.result.components[i].value.toString(),
						expectMatches[i]
					);
				}
			}
		} else {
			assert.is(m.fail, true);
			assert.is(m.pos, expectPos);
		}
	});
}

tsts('Fragile[debug] tests:', () => {
	const concat = new BnfConcat(new BnfChar('0'), new BnfChar('A', true));
	assert.is(concat.toString(), '("0" "A"/i)');
});

tsts.run();
