import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { StackTrace } from '../../src/stacktrace/StackTrace';
import { WindowStr } from '../../src/primitive/WindowStr';
import { ParseProblem } from '../../src/error/ParseProblem';
import util from 'util';

const tsts = suite('StackTrace');

const parseSet:[string|undefined,boolean,number][]=[
    ['\n',false,0],
    ['Error\n     at Stack.new (\\src\\error\\parseStack.ts:173:24)',false,1],
    ['Error\n     at Stack.new (\\src\\error\\parseStack.ts:173:24)\n     at Number.runner (\\node_modules\\3rd-party-danger\\index.js:78:16)',false,2],
    ['Error\n     at Stack.new (\\src\\error\\parseStack.ts:173:24)\n     at Number.runner (\\node_modules\\3rd-party-danger\\index.js:78:16)',true,1],
    ['Error\n     at Stack.new (\\src\\error\\parseStack.ts:173:24)\n     at Number.runner (/node_modules/3rd-party-danger/index.js:78:16)',false,2],
    ['Error\n     at Stack.new (\\src\\error\\parseStack.ts:173:24)\n     at Number.runner (/node_modules/3rd-party-danger/index.js:78:16)',true,1],
];
for(const [stack,localOnly,expect] of parseSet) {
    tsts(`parse(${stack})`, () => {
        const p=StackTrace.parse(stack,{localOnly});
		if (p instanceof ParseProblem) {
            console.log(p.toString());
		} else assert.equal(p?.entries.length,expect);
	});

}

tsts(`parse(undefined)`,()=>{
    const p=StackTrace.parse(undefined);
    assert.equal(p,undefined);
})


tsts(`coverage`, () => {
	const s = new StackTrace([]);

	s.toString(); //With colours... tricky to test

	const str = Object.prototype.toString.call(s);
	assert.is(str.indexOf('StackTrace') > 0, true, 'toStringTag');

	const u = util.inspect(s);

    const n=StackTrace.new();
	//Colours.. tricky to test
});

tsts.run();