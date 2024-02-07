import { suite } from 'uvu';
import { BnfAlt, BnfChar, BnfString, BnfRange } from '../../src/abnf';
import * as assert from 'uvu/assert';
import { WindowStr } from '../../src/primitive/WindowStr';

const tsts = suite('ABNF alt');

const testAltDescr: {
	items: BnfChar[];
	descr: string;
}[] = [
	{ items: [new BnfChar('0'), new BnfChar('1')], descr: '("0" / "1")' },
	{ items: [new BnfChar('$')], descr: '"$"' }, //Single alt isn't bracketed
];
for (const { items, descr } of testAltDescr) {
	tsts(`Alt(${descr}).descr():`, () => {
		const a = new BnfAlt(...items);
		assert.is(a.descr(), descr);
	});
}

const testMatch: {
	haystack: string;
	alts: Array<BnfChar | BnfRange | BnfString>;
	expectRem?: string;
	expectMatch?: string;
}[] = [
	{
		haystack: 'Hello',
		alts: [new BnfString('Hey'), new BnfString('Hi'), new BnfString('yo')],
	},
	{
		haystack: 'Hello',
		alts: [new BnfString('Hey'), new BnfString('Hi'), new BnfString('hello')],
		expectRem: '',
		expectMatch: 'Hello',
	},
	{
		haystack: 'TRUE',
		alts: [new BnfString('true'), new BnfString('false')],
		expectRem: '',
		expectMatch: 'TRUE',
	},
	{
		haystack: 'False',
		alts: [new BnfString('true'), new BnfString('false')],
		expectRem: '',
		expectMatch: 'False',
	},
];
for (const { haystack, alts: needles, expectRem, expectMatch } of testMatch) {
	tsts(`Alt().atStartOf(${haystack}):`, () => {
		const c = new BnfAlt(...needles);
		const w = WindowStr.new(haystack);
		const m = c.atStartOf(w);
		//console.log(m);
		if (expectRem !== undefined) {
			assert.is(m.fail, false,'failed!');
			assert.is(m.remain?.toString(), expectRem);
			assert.equal(m.result?.value.toString(), expectMatch);
		} else {
			assert.is(m.fail, true);
			//pos is always 0
		}
	});
}

tsts('Fragile[debug] tests:', () => {
	const alt = new BnfAlt(new BnfChar('0'), new BnfChar('1', true));
	assert.is(alt.toString(), '("0" / "1")');
});

tsts.run();
