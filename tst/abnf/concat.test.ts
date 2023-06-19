import { suite } from 'uvu';
import * as bnf from "../../src/abnf/bnf.js";
import * as assert from 'uvu/assert';
import { WindowStr } from '../../src/primitive/WindowStr.js';

const tsts = suite('ABNF concat');

const testConcatDescr:{
    items:Array<bnf.BnfChar|bnf.BnfRange|bnf.BnfString>,
    descr:string,
}[]=[
    {items:[new bnf.BnfChar('h'),new bnf.BnfChar('i')],descr:'("h" "i")'},//Single (collapsed) string isn't bracketed
    {items:[new bnf.BnfChar("h"),new bnf.BnfChar("i"),new bnf.BnfRange("0","9")],descr:'("h" "i" "0"-"9")'},
    {items:[new bnf.BnfChar("h"),new bnf.BnfChar("i"),new bnf.BnfRange(0,9)],descr:'("h" "i" %x00-09)'},
    {items:[new bnf.BnfString("Hello")],descr:'"Hello"'},
];

for(const {items,descr} of testConcatDescr) {
    tsts(`Concat(${descr}).descr():`,()=>{
        const c=new bnf.BnfConcat(...items);
        assert.is(c.descr(),descr);
    });
}

const testMatch:{
    haystack:string,
    needles:Array<bnf.BnfChar|bnf.BnfRange|bnf.BnfString>,
    //IF MATCH
    expectRem?:string,//Remaining string
    expectMatches:string[],
    //IF FAIL
    expectPos?:number,//Position of failure (if partial match)
}[]=[
    {haystack:"Hello",needles:[new bnf.BnfString("Hey"),new bnf.BnfString("there")],expectPos:0,expectMatches:[]},
    {haystack:'Hi there',needles:[new bnf.BnfString('hi'),new bnf.BnfChar(' '),new bnf.BnfString('THERE')],
        expectRem:'',expectMatches:['Hi',' ','there']},
    {haystack:'Hi there2',needles:[new bnf.BnfString('hi'),new bnf.BnfString('THERE')],
        expectPos:2,expectMatches:[]},//Fails because there's no space allowed
];
for (const {haystack,needles,expectRem,expectPos,expectMatches} of testMatch) {
    tsts(`Concat().atStartOf(${haystack}):`,()=>{
        const c=new bnf.BnfConcat(...needles);
        const w=new WindowStr(haystack);
        const m=c.atStartOf(w);
        //console.log(m);
        if (expectRem!==undefined) {
            assert.is(m.fail,false);
            assert.is(m.remain?.toString(),expectRem);
            assert.is(m.result?.components?.length,expectMatches?.length)
            if (m.result?.components === undefined) {
                assert.is(true,false,'Expecting components')
            } else {
                for(let i=0;i<expectMatches.length;i++) {
                    assert.equal(m.result.components[i].value.toString(),expectMatches[i]);
                }
            }
        } else {
            assert.is(m.fail,true);
            assert.is(m.pos,expectPos);
        }
    });
}

tsts('Fragile[debug] tests:',()=>{
    const concat=new bnf.BnfConcat(new bnf.BnfChar("0"),new bnf.BnfChar("A",true));
    assert.is(concat.toString(),'("0" "A"/i)');
});

tsts.run();