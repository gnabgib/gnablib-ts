import { suite } from 'uvu';
import {bnf} from "../../src/abnf/bnf.js";
import * as assert from 'uvu/assert';
import { WindowStr } from '../../src/primitive/WindowStr.js';

const tsts = suite('ABNF alt');


const testAltDescr:{
    items:bnf.Char[],
    descr:string
}[]=[
    {items:[new bnf.Char('0'),new bnf.Char('1')],descr:'("0" / "1")'},
    {items:[new bnf.Char('$')],descr:'"$"'},//Single alt isn't bracketed
];
for (const {items,descr} of testAltDescr) {
    tsts(`Alt(${descr}).descr():`,()=>{
        const a=new bnf.Alt(...items);
        assert.is(a.descr(),descr);
    });
}

const testMatch:{
    haystack:string,
    alts:Array<bnf.Char|bnf.Range|bnf.String>,
    expectRem?:string,
    expectMatch?:string
}[]=[
    {haystack:"Hello",alts:[new bnf.String("Hey"),new bnf.String("Hi"),new bnf.String('yo')]},
    {haystack:"Hello",alts:[new bnf.String("Hey"),new bnf.String("Hi"),new bnf.String("hello")],expectRem:'',expectMatch:'Hello'},
    {haystack:'TRUE',alts:[new bnf.String('true'),new bnf.String('false')],expectRem:'',expectMatch:'TRUE'},
    {haystack:'False',alts:[new bnf.String('true'),new bnf.String('false')],expectRem:'',expectMatch:'False'},
];
for (const {haystack,alts: needles,expectRem,expectMatch} of testMatch) {
    tsts(`Alt().atStartOf(${haystack}):`,()=>{
        const c=new bnf.Alt(...needles);
        const w=new WindowStr(haystack);
        const m=c.atStartOf(w);
        //console.log(m);
        if (expectRem!==undefined) {
            assert.is(m.fail,false);
            assert.is(m.remain.toString(),expectRem);
            assert.equal(m.result.value.toString(),expectMatch);
        } else {
            assert.is(m.fail,true);
            //pos is always 0
        }
    });
}

tsts('Fragile[debug] tests:',()=>{
    const alt=new bnf.Alt(new bnf.Char('0'),new bnf.Char('1',true));
    assert.is(alt.toString(),'("0" / "1")');
});

tsts.run();