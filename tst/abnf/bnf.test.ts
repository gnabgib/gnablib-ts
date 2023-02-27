import { suite } from 'uvu';
import {bnf} from "../../src/abnf/bnf.js";
import * as assert from 'uvu/assert';

const tsts = suite('ABNF/rfc5234');

const validCharTests:{
    chr:string,
    ord:number,
    caseInsensitive:boolean|undefined
}[]=[
    {chr:'!',ord:33,caseInsensitive:undefined},
    {chr:' ',ord:32,caseInsensitive:undefined},
    {chr:'$',ord:0x24,caseInsensitive:undefined},
    {chr:'£',ord:0xA3,caseInsensitive:false},
    {chr:'ह',ord:0x939,caseInsensitive:false},
    {chr:'€',ord:0x20AC,caseInsensitive:false},
    {chr:'한',ord:0xD55C,caseInsensitive:false},
    //JS uses UTF-16, so cannot represent this 32bit unicode char
    //['𐍈',0x10348],
    //Nor this emoji
    //['😄',0x1f604],
];
for(const {chr,ord,caseInsensitive} of validCharTests) {
    tsts(`Char('${chr}'):`,()=> {
        const c=new bnf.Char(chr);
        assert.is(c.chr,chr);
        assert.is(c.ord,ord);
        assert.is(c.caseInsensitive,caseInsensitive);
    });
    tsts(`Char(${ord}):`,()=> {
        const c=new bnf.Char(ord);
        assert.is(c.chr,chr);
        assert.is(c.ord,ord);
        assert.is(c.caseInsensitive,caseInsensitive);
    });
}

const charSensitiveTests:{
    chr:string|bnf.Char,
    insensitive:boolean|undefined,
    expectedStr:string,
    expectedCI:boolean|undefined
}[]=[
    //Valid sensitives
    {chr:"A",insensitive:undefined,expectedStr:'"A"',expectedCI:false},
    {chr:"A",insensitive:true,expectedStr:'"A"/i',expectedCI:true},
    {chr:"A",insensitive:false,expectedStr:'"A"',expectedCI:false},
    {chr:"a",insensitive:undefined,expectedStr:'"a"',expectedCI:false},
    {chr:"a",insensitive:true,expectedStr:'"a"/i',expectedCI:true},
    {chr:"a",insensitive:false,expectedStr:'"a"',expectedCI:false},
    //From a char - new insensitive overrides char if not undefined
    {chr:new bnf.Char('A',undefined),insensitive:undefined,expectedStr:'"A"',expectedCI:false},
    {chr:new bnf.Char('A',undefined),insensitive:true,expectedStr:'"A"/i',expectedCI:true},
    {chr:new bnf.Char('A',undefined),insensitive:false,expectedStr:'"A"',expectedCI:false},
    {chr:new bnf.Char('A',true),insensitive:undefined,expectedStr:'"A"/i',expectedCI:true},
    {chr:new bnf.Char('A',true),insensitive:true,expectedStr:'"A"/i',expectedCI:true},
    {chr:new bnf.Char('A',true),insensitive:false,expectedStr:'"A"',expectedCI:false},
    {chr:new bnf.Char('A',false),insensitive:undefined,expectedStr:'"A"',expectedCI:false},
    {chr:new bnf.Char('A',false),insensitive:true,expectedStr:'"A"/i',expectedCI:true},
    {chr:new bnf.Char('A',false),insensitive:false,expectedStr:'"A"',expectedCI:false},

    //Invalid (should override to undefined)
    {chr:"?",insensitive:undefined,expectedStr:'"?"',expectedCI:undefined},
    {chr:"?",insensitive:true,expectedStr:'"?"',expectedCI:undefined},
    {chr:"?",insensitive:false,expectedStr:'"?"',expectedCI:undefined},
    {chr:"0",insensitive:undefined,expectedStr:'"0"',expectedCI:undefined},
    {chr:"0",insensitive:true,expectedStr:'"0"',expectedCI:undefined},
    {chr:"0",insensitive:false,expectedStr:'"0"',expectedCI:undefined},
    {chr:"_",insensitive:undefined,expectedStr:'"_"',expectedCI:undefined},
    {chr:"_",insensitive:true,expectedStr:'"_"',expectedCI:undefined},
    {chr:"_",insensitive:false,expectedStr:'"_"',expectedCI:undefined},
    {chr:"~",insensitive:undefined,expectedStr:'"~"',expectedCI:undefined},
    {chr:"~",insensitive:true,expectedStr:'"~"',expectedCI:undefined},
    {chr:"~",insensitive:false,expectedStr:'"~"',expectedCI:undefined},
    {chr:"/",insensitive:undefined,expectedStr:'"/"',expectedCI:undefined},
    {chr:"/",insensitive:true,expectedStr:'"/"',expectedCI:undefined},
    {chr:"/",insensitive:false,expectedStr:'"/"',expectedCI:undefined},
];
for(const {chr,insensitive,expectedStr,expectedCI} of charSensitiveTests) {
    tsts(`Char(${chr},${insensitive}) - sens+str:`,()=>{
        const c=new bnf.Char(chr,insensitive);
        assert.is(c.caseInsensitive,expectedCI,'CI match');
        assert.is(''+c,expectedStr,'Debug match');
    });
}

const invalidCharTests=[
    undefined,
    null,
    '',
    "this is a string",
    //Emoji are >1 char
    '🌝'
];
for(const chr of invalidCharTests) {
    tsts(`invalid Char('${chr}'):`,()=>{
        assert.throws(()=>new bnf.Char(chr));
    });
}

const testCharDescr=[
    ["!",'"!"'],
    ["\x00",'%x00'],
]
for (const [char,descr] of testCharDescr) {
    tsts(`Char(${char}).descr():`,()=>{
        const c=new bnf.Char(char);
        assert.is(c.descr(),descr);
    })
}

const validRangeTests=[
    ['a','z',26],
    ['0','9',10],
    ['0','1',2],
];
for (const [start,end,len] of validRangeTests) {
    tsts(`Range(${start},${end}):`,()=>{
        const r=new bnf.Range(start,end);
        assert.is(r.start.chr,start);
        assert.is(r.end.chr,end);
        assert.is(r.length,len);
        assert.is(Array.from(r).length,len,'Iterable test (limited)');
    });
}

const invalidRangeTests:{
    start:string|bnf.Char|undefined,
    end:string|bnf.Char|undefined
}[]=[
    {start:'0',end:'0'},//Not big enough
    {start:'1',end:'0'},//Wrong way around
    {start:'A',end:new bnf.Char('F',true)},//Cannot use case insensitive char
    {start:new bnf.Char('A',true),end:'F'},//Cannot use case insensitive char
    {start:new bnf.Char('A',true),end:new bnf.Char('F',true)},//Cannot use case insensitive char
    {start:undefined,end:undefined},//WTF man
];
for(const {start,end} of invalidRangeTests) {
    tsts(`invalid Range(${start},${end}):`,()=>{
        assert.throws(()=>new bnf.Range(start,end));
    });
}

const testRangeDescr=[
    ['a','z','"a"-"z"'],
    ['0','9','"0"-"9"'],
    [0,9,'%x00-09'],
]
for(const [start,end,descr] of testRangeDescr) {
    tsts(`Range(${start},${end}).descr():`,()=>{
        const r=new bnf.Range(start,end);
        assert.is(r.descr(),descr);
    });
}

const testConcatDescr:{
    items:bnf.Char|bnf.Range|bnf.String,
    descr:string,
}[]=[
    {items:[new bnf.Char('h'),new bnf.Char('i')],descr:'("h" "i")'},//Single (collapsed) string isn't bracketed
    {items:[new bnf.Char("h"),new bnf.Char("i"),new bnf.Range("0","9")],descr:'("h" "i" "0"-"9")'},
    {items:[new bnf.Char("h"),new bnf.Char("i"),new bnf.Range(0,9)],descr:'("h" "i" %x00-09)'},
    {items:[new bnf.String("Hello")],descr:'"Hello"'},
];

for(const {items,descr} of testConcatDescr) {
    tsts(`Concat(${descr}).descr():`,()=>{
        const c=new bnf.Concat(...items);
        assert.is(c.descr(),descr);
    });
}

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

const testString:{
    str:string|bnf.Char[],
    caseInsensitive:boolean|undefined,
    expectedStr:string,
    expectedCI:boolean|undefined|"mix"
}[]=[
    //All one type
    {str:"ab",caseInsensitive:true,expectedStr:'"ab"/i',expectedCI:true},//Note we flag insensitive
    {str:"ab",caseInsensitive:false,expectedStr:'"ab"',expectedCI:false},
    //All undefined
    {str:"01",caseInsensitive:true,expectedStr:'"01"',expectedCI:undefined},
    {str:"01",caseInsensitive:false,expectedStr:'"01"',expectedCI:undefined},
    //All undefined/one type
    {str:"a01",caseInsensitive:true,expectedStr:'"a01"/i',expectedCI:true},
    {str:"a01",caseInsensitive:false,expectedStr:'"a01"',expectedCI:false},
    //Ctrl characters (undefined)
    {str:"\r\n",caseInsensitive:true,expectedStr:'%x0D.0A',expectedCI:undefined},
    {str:"\r\n",caseInsensitive:false,expectedStr:'%x0D.0A',expectedCI:undefined},
    //Mixed ctrl and one type
    {str:"a\tb",caseInsensitive:true,expectedStr:'%x61.09.62/i',expectedCI:true},
    {str:"a\tb",caseInsensitive:false,expectedStr:'%x61.09.62',expectedCI:false},
    //Mixed s/i
    {str:[new bnf.Char('A',false),new bnf.Char('b',true)],caseInsensitive:true,expectedStr:'("A" "b"/i)',expectedCI:"mix"},
    {str:[new bnf.Char('A',false),new bnf.Char('b',true)],caseInsensitive:false,expectedStr:'("A" "b"/i)',expectedCI:"mix"},
    //Mixed s/i/ctrl
    {str:[new bnf.Char('A',false),new bnf.Char('\t'),new bnf.Char('b',true)],caseInsensitive:true,expectedStr:'("A" %x09 "b"/i)',expectedCI:"mix"},
]
for(const {str,caseInsensitive,expectedStr,expectedCI} of testString) {
    tsts(`String(${str},${caseInsensitive}) - sens+str:`,()=>{
        const s=new bnf.String(str,caseInsensitive);
        assert.is(s.caseInsensitive,expectedCI);
        assert.is(''+s,expectedStr);
    });
}

const testStringDescr:{
    str:string,
    descr:string
}[]=[
    {str:'Hello',descr:'"Hello"'},
    {str:'\r\n',descr:'%x0D.0A'},
];
for(const {str,descr} of testStringDescr) {
    tsts(`String(${str}).descr():`,()=>{
        const s=new bnf.String(str);
        assert.is(s.descr(),descr);
    });
}

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
        const s=new bnf.Repeat(new bnf.Char(char),min,max);
        assert.is(s.descr(),descr);
    });
}

tsts('Fragile[debug] tests:',()=>{
    //These tests are a little rigid, but want to make sure reasonable debug info is available
    const char=new bnf.Char("a",true);
    assert.is(char.toString(),'"a"/i');

    const range=new bnf.Range("a","z");
    assert.is(range.toString(),'"a"-"z"');
    //Range cannot include an insensitive element

    const concat=new bnf.Concat(new bnf.Char("0"),new bnf.Char("A",true));
    assert.is(concat.toString(),'("0" "A"/i)');

    const alt=new bnf.Alt(new bnf.Char('0'),new bnf.Char('1',true));
    assert.is(alt.toString(),'("0" / "1")');

    const str=new bnf.String("gnabgib");
    // Using /i from regex to indicate case insensitivity (the alternatives would be regex
    // sets [Gg] or some other notation?)
    assert.is(""+str,'"gnabgib"/i','Coerce to string via concat');

    const rep=bnf.Repeat.Optional(alt);
    assert.is(rep.toString(),'0*1("0" / "1")');
    const rep2=bnf.Repeat.OnePlus(alt);
    assert.is(rep2.toString(),'1*∞("0" / "1")');
});

tsts.run();
