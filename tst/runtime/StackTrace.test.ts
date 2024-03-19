import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { StackTrace } from '../../src/runtime/StackTrace';
import { ParseProblem } from '../../src/error/ParseProblem';
import util from 'util';
import { config } from '../config';
import { Color } from '../../src/cli/tty';

const tsts = suite('StackTrace');
const DEMO=false || config.getBool('demo');
//By importing Color, and setting up this pointless 'blue' we configure 'color' and detect
// any environmental concerns about the use of color. By default (if undefined) no color
// will be used, but once the tty page has been loaded the inverse is true - color will be
// used unless the env says otherwise
const blue=Color.blue;


const parseSet:[string|undefined,boolean,number][]=[
    ['\n',false,0],
    ['Error\n'+
        '     at Stack.new (\\src\\error\\parseStack.ts:173:24)',false,1],
    ['Error\n'+
        '     at Stack.new (\\src\\error\\parseStack.ts:173:24)\n'+
        '     at Number.runner (\\node_modules\\3rd-party-danger\\index.js:78:16)',false,2],
    ['Error\n'+
        '     at Stack.new (\\src\\error\\parseStack.ts:173:24)\n'+
        '     at Number.runner (\\node_modules\\3rd-party-danger\\index.js:78:16)',true,1],
    ['Error\n'+
        '     at Stack.new (\\src\\error\\parseStack.ts:173:24)\n'+
        '     at Number.runner (/node_modules/3rd-party-danger/index.js:78:16)',false,2],
    ['Error\n'+
        '     at Stack.new (\\src\\error\\parseStack.ts:173:24)\n'+
        '     at Number.runner (/node_modules/3rd-party-danger/index.js:78:16)',true,1],
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
    assert.equal(p.entries.length,0);
})

tsts(`new(limit:1)`,()=>{
    const trace=StackTrace.new({limit:1});
    assert.equal(trace.entries.length,1);
})


tsts(`coverage`, () => {
	const s = new StackTrace([]);

	s.toString(); //With colors... tricky to test

	const str = Object.prototype.toString.call(s);
	assert.is(str.indexOf('StackTrace') > 0, true, 'toStringTag');

	const u = util.inspect(s);
});

if (DEMO) {
    console.log('--')
    console.log(StackTrace.new());
    console.log('--Limit 1:')
    console.log(StackTrace.new({limit:1}));
    console.log('--Local only:')
    console.log(StackTrace.new({localOnly:true}));
}

tsts.run();