import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { callFrom } from '../../src/runtime/callFrom';
import { config } from '../config';

const tsts = suite('callFrom');
const DEMO=false || config.getBool('demo');

const parseSet:[string,string][]=[
    ['Ignored\n',''],
    ['Error\n'+
        '     at -ignored line\n'+
        '     at Stack.new (\\src\\error\\parseStack.ts:173:23)\n'+
        '     at Stack.new (\\src\\error\\parseStack.ts:173:24)\n',
        '     at Stack.new (\\src\\error\\parseStack.ts:173:23)'],
    ['     at -ignored line\n'+
        '     at Stack.new (\\src\\error\\parseStack.ts:173:25)\n'+
        '     at Stack.new (\\src\\error\\parseStack.ts:173:26)\n',
        '     at Stack.new (\\src\\error\\parseStack.ts:173:25)'],
];
for(const [stack,expect] of parseSet) {
    tsts(`callFrom(${stack})`, () => {
        const ent=callFrom(1,stack);
        assert.equal(ent,expect);
	});
}


tsts(`coverage`, () => {
    const ent=callFrom();
});

if (DEMO) {
    console.log('--');
    //should be something like: ...\callFrom.test.ts:48:44
    // we don't need back>0 because this is a direct call
    console.log(callFrom(0));
}

tsts.run();