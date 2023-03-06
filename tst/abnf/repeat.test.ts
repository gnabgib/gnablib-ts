import { suite } from 'uvu';
import {bnf} from "../../src/abnf/bnf.js";
import * as assert from 'uvu/assert';
import { WindowStr } from '../../src/primitive/WindowStr.js';

//abnf /rfc5234
const tsts = suite('ABNF repeat');

const testRepeatDescr:{
    char:string,
    min:number,
    max:number,
    descr:string
}[]=[
    {char:"!",min:1,max:3,descr:'1*3"!"'},
    {char:"o",min:3,max:3,descr:'3"o"'},
    {char:"*",min:0,max:5,descr:'*5"*"'},
    {char:"m",min:1,max:Number.MAX_SAFE_INTEGER,descr:'1*"m"'},
];
for(const {char,min,max,descr} of testRepeatDescr) {
    tsts(`Repeat(${char},${min},${max}).descr():`,()=>{
        const s=bnf.Repeat.Between(min,max,new bnf.Char(char));
        assert.is(s.descr(),descr);
    });
}

const testMatch:{
    haystack:string,
    needle:bnf.Char|bnf.Range|bnf.String,
    min:number,
    max:number,
    //IF SUCCESS
    expectRem?:string,//Remaining text
    expectMatch?:string,//Matches
    //IF FAIL
    expectPos?:number,
}[]=[
    {haystack:'101 dalmatians',needle:new bnf.Range('0','9'),min:4,max:10,expectPos:3},//Not enough numbers
    {haystack:'101 dalmatians',needle:new bnf.Range('0','9'),min:0,max:10,expectRem:' dalmatians',expectMatch:'101'},
    {haystack:'101 dalmatians',needle:new bnf.Range('0','9'),min:0,max:2,expectRem:'1 dalmatians',expectMatch:'10'},
];
for (const {haystack,needle,min,max,expectRem,expectMatch,expectPos} of testMatch) {
    tsts(`Repeat(${needle},${min},${max}).atStartOf(${haystack}):`,()=>{
        const c=bnf.Repeat.Between(min,max,needle);
        const w=new WindowStr(haystack);
        const m=c.atStartOf(w);
        //console.log(m);
        if (expectRem!==undefined) {
            assert.is(m.fail,false);
            assert.is(m.remain.toString(),expectRem);
            assert.is(m.result.value.toString(),expectMatch);
        } else {
            assert.is(m.fail,true);
            assert.is(m.pos,expectPos);
        }
    });
}

tsts('Fragile[debug] tests:',()=>{
    const alt=new bnf.Alt(new bnf.Char('0'),new bnf.Char('1',true));
    const rep=bnf.Repeat.Optional(alt);
    assert.is(rep.toString(),'0*1("0" / "1")');
    const rep2=bnf.Repeat.OnePlus(alt);
    assert.is(rep2.toString(),'1*∞("0" / "1")');
});

tsts.run();
