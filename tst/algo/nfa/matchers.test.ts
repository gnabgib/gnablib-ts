import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import {  CharMatch, InsensitiveMatch, Nfa, RangeMatch } from '../../../src/algo/nfa/index.js';

const tsts = suite('matchers');

const cmTests:[number,string][]=[
    [60,"'<'"],
    [10,"\\d10"],
]
for(const [code,str] of cmTests) {
    tsts(`CharMatch(${code})`,()=>{
        const cm=new CharMatch(code);
        assert.equal(cm.toString(),str);
        assert.equal(cm.match(code),true);
        assert.equal(cm.match(code+1),false);
    
    });   
}

const imTests:[number,string][]=[
    [65,'97/i'],
    [52,'52/i'],
];
for(const [code,str] of imTests) {
    tsts(`InsensitiveMatch(${code})`,()=>{
        const cm=new InsensitiveMatch(code);
        assert.equal(cm.toString(),str);
        assert.equal(cm.match(code),true,'matches code');
        assert.equal(cm.match(code+1),false,'next code does not match');   
    });   
}

tsts(`InsensitiveMatch(z)`,()=>{
    const cm=new InsensitiveMatch('z');
    assert.equal(cm.toString(),'122/i');
    assert.equal(cm.match(122),true,'matches code');
    assert.equal(cm.match(123),false,'next code does not match');   
    assert.equal(cm.match(90),true);//Case insensitive
})

const rm10_20Test:[number,boolean][]=[
    [9,false],
    [10,true],
    [20,true],
    [30,false],
];
for(const [code,expect] of rm10_20Test) {
    tsts(`RangeMatch(${code})`,()=>{
        const rm=new RangeMatch(10,20);
        assert.equal(rm.toString(),'10-20');
        assert.equal(rm.match(code),expect);
    });   
}
tsts.run();
