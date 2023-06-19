import { suite } from 'uvu';
import * as bnf from "../../src/abnf/bnf.js";
import * as assert from 'uvu/assert';
import { WindowStr } from '../../src/primitive/WindowStr.js';

const tsts = suite('ABNF alt');


const testAltDescr:{
    items:bnf.BnfChar[],
    descr:string
}[]=[
    {items:[new bnf.BnfChar('0'),new bnf.BnfChar('1')],descr:'("0" / "1")'},
    {items:[new bnf.BnfChar('$')],descr:'"$"'},//Single alt isn't bracketed
];
for (const {items,descr} of testAltDescr) {
    tsts(`Alt(${descr}).descr():`,()=>{
        const a=new bnf.BnfAlt(...items);
        assert.is(a.descr(),descr);
    });
}

const testMatch:{
    haystack:string,
    alts:Array<bnf.BnfChar|bnf.BnfRange|bnf.BnfString>,
    expectRem?:string,
    expectMatch?:string
}[]=[
    {haystack:"Hello",alts:[new bnf.BnfString("Hey"),new bnf.BnfString("Hi"),new bnf.BnfString('yo')]},
    {haystack:"Hello",alts:[new bnf.BnfString("Hey"),new bnf.BnfString("Hi"),new bnf.BnfString("hello")],expectRem:'',expectMatch:'Hello'},
    {haystack:'TRUE',alts:[new bnf.BnfString('true'),new bnf.BnfString('false')],expectRem:'',expectMatch:'TRUE'},
    {haystack:'False',alts:[new bnf.BnfString('true'),new bnf.BnfString('false')],expectRem:'',expectMatch:'False'},
];
for (const {haystack,alts: needles,expectRem,expectMatch} of testMatch) {
    tsts(`Alt().atStartOf(${haystack}):`,()=>{
        const c=new bnf.BnfAlt(...needles);
        const w=new WindowStr(haystack);
        const m=c.atStartOf(w);
        //console.log(m);
        if (expectRem!==undefined) {
            assert.is(m.fail,false);
            assert.is(m.remain?.toString(),expectRem);
            assert.equal(m.result?.value.toString(),expectMatch);
        } else {
            assert.is(m.fail,true);
            //pos is always 0
        }
    });
}

tsts('Fragile[debug] tests:',()=>{
    const alt=new bnf.BnfAlt(new bnf.BnfChar('0'),new bnf.BnfChar('1',true));
    assert.is(alt.toString(),'("0" / "1")');
});

tsts.run();