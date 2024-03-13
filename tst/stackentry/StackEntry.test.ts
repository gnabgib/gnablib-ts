import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { StackEntry } from '../../src/stacktrace/StackEntry';
import { WindowStr } from '../../src/primitive/WindowStr';
import { ParseProblem } from '../../src/error/ParseProblem';
import util from 'util';

const tsts = suite('StackEntry');

const parseV8Set: [string, string][] = [
	['    at baz (filename.js:10:15)', 'baz filename.js:10:15'],
	['    at bar (filename.js:6:3)', 'bar filename.js:6:3'],
	['    at foo (filename.js:2:3)', 'foo filename.js:2:3'],
	['    at filename.js:13:1', '. filename.js:13:1'], //Note no method becomes . (for root)

	[
		'    at Stack.new (\\src\\error\\parseStack.ts:173:24)',
		'Stack.new \\src\\error\\parseStack.ts:173:24',
	],
	[
		'    at Object.handler (\\tst\\error\\parseStack.test.ts:16:40)',
		'Object.handler \\tst\\error\\parseStack.test.ts:16:40',
	],
	[
		'    at Number.runner (\\node_modules\\3rd-party-danger\\index.js:78:16)',
		'Number.runner \\node_modules\\3rd-party-danger\\index.js:78:16',
	],
	[
		'    at async Object.exec (\\node_modules\\3rd-party-danger\\index.js:141:33)',
		'async Object.exec \\node_modules\\3rd-party-danger\\index.js:141:33',
	],
	[
		'    at async exports.run (\\node_modules\\3rd-party-danger\\index.js:11:2)',
		'async exports.run \\node_modules\\3rd-party-danger\\index.js:11:2',
	],
	[
		'    at async \\node_modules\\3rd-party-danger\\bin.js:28:5',
		'async \\node_modules\\3rd-party-danger\\bin.js:28:5',
	],
];
for (const [parse, expect] of parseV8Set) {
	tsts(`parseV8(${parse})`, () => {
		const w = WindowStr.new(parse);
		const s = StackEntry.parseV8(w);

		if (s instanceof ParseProblem) console.log(s.inColor());
		else assert.equal(s?.toString(false), expect);
	});
}

const badParseV8Set: [string, number, number][] = [
	['    at baz (filename.js:10:15', 12, 29], //missing last )
	['    at baz (filename.js:10)', 12, 23], //missing second :
	['    at baz (filename.js)', 12, 23], //missing :
	['baz (filename.js:10:15)', 0, 23], //missing \s*at
];
for (const [parse, start, end] of badParseV8Set) {
	const w = WindowStr.new(parse);

	tsts(`parseV8(${w}) fails`, () => {
		const p = StackEntry.parseV8(w);
		if (p instanceof ParseProblem) {
			assert.equal(p.start, start, 'start');
			assert.equal(p.end, end, 'end');
		} else assert.instance(p, ParseProblem);
	});
}

const parseSpiderSet: [string, string][] = [
	['baz@filename.js:10:15', 'baz filename.js:10:15'],
	['bar@filename.js:6:3', 'bar filename.js:6:3'],
	['foo@filename.js:2:3', 'foo filename.js:2:3'],
	['@filename.js:13:1', '. filename.js:13:1'], //Note no method becomes . (for root)
];
for (const [parse, expect] of parseSpiderSet) {
	tsts(`parseSpider(${parse})`, () => {
		const w = WindowStr.new(parse);
		const s = StackEntry.parseSpider(w);

		if (s instanceof ParseProblem) console.log(s.inColor());
		else assert.equal(s?.toString(false), expect);
	});
}

const badParseSpiderSet: [string, number, number][] = [
	['filename.js:10:15', 0, 17], //missing @
	['@filename.js:10', 1, 12], //missing second :
	['@filename.js', 1, 12], //missing first :
];
for (const [parse, start, end] of badParseSpiderSet) {
	const w = WindowStr.new(parse);

	tsts(`parseSpider(${w}) fails`, () => {
		const p = StackEntry.parseSpider(w);
		if (p instanceof ParseProblem) {
			assert.equal(p.start, start, 'start');
			assert.equal(p.end, end, 'end');
		} else assert.instance(p, ParseProblem);
	});
}

tsts(`coverage`, () => {
	const w = WindowStr.new('    at foo (filename.js:2:3)');
	const s = StackEntry.parseV8(w);

	s.toString(); //With colours... tricky to test

	if (s instanceof ParseProblem) return;

	assert.equal(s?.v8Style(), '    at foo (filename.js:2:3)', 'v8Style');

	assert.equal(s?.spiderStyle(), 'foo@filename.js:2:3', 'spiderStyle');

	const str = Object.prototype.toString.call(s);
	assert.is(str.indexOf('StackEntry') > 0, true, 'toStringTag');

	const u = util.inspect(s);
	//Colours.. tricky to test
});

// tsts(`general`,()=>{
//     const w=WindowStr.new('at herp:1');
//     const s=StackEntry.parseV8(w);
//     console.log(s);
// });

tsts.run();
