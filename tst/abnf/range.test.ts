import { suite } from 'uvu';
import { BnfChar, BnfRange} from "../../src/abnf";
import * as assert from 'uvu/assert';
import { WindowStr } from '../../src/primitive';

const tsts = suite('ABNF range');

const validRangeTests=[
    ['a','z',26],
    ['0','9',10],
    ['0','1',2],
];
for (const [start,end,len] of validRangeTests) {
    tsts(`Range(${start},${end}):`,()=>{
        const r=new BnfRange(start,end);
        assert.is(r.start.chr,start);
        assert.is(r.end.chr,end);
        assert.is(r.rangeLength,len);
        assert.is(Array.from(r).length,len,'Iterable test (limited)');
    });
}

const invalidRangeTests:{
    start:string|BnfChar|undefined,
    end:string|BnfChar|undefined
}[]=[
    {start:'0',end:'0'},//Not big enough
    {start:'1',end:'0'},//Wrong way around
    {start:'A',end:new BnfChar('F',true)},//Cannot use case insensitive char
    {start:new BnfChar('A',true),end:'F'},//Cannot use case insensitive char
    {start:new BnfChar('A',true),end:new BnfChar('F',true)},//Cannot use case insensitive char
    {start:undefined,end:undefined},//WTF man
];
for(const {start,end} of invalidRangeTests) {
    tsts(`invalid Range(${start},${end}):`,()=>{
        assert.throws(()=>new BnfRange(start,end));
    });
}

const testRangeDescr=[
    ['a','z','"a"-"z"'],
    ['0','9','"0"-"9"'],
    [0,9,'%x00-09'],
]
for(const [start,end,descr] of testRangeDescr) {
    tsts(`Range(${start},${end}).descr():`,()=>{
        const r=new BnfRange(start,end);
        assert.is(r.descr(),descr);
    });
}

const testMatch:{
    haystack:string,
    needleStart:string|number,
    needleEnd:string|number,
    expectRem?:string,
    expectMatch?:string
}[]=[
    {haystack:"Hello",needleStart:"a",needleEnd:'z'},
    {haystack:"Hello",needleStart:"H",needleEnd:'Z',expectRem:'ello',expectMatch:'H'},
    {haystack:"Hello",needleStart:"A",needleEnd:'Z',expectRem:'ello',expectMatch:'H'},
    {haystack:'\r\n',needleStart:0,needleEnd:0x20,expectRem:'\n',expectMatch:'\r'},
];
for (const {haystack,needleStart,needleEnd,expectRem,expectMatch} of testMatch) {
    tsts(`Range(${needleStart},${needleEnd}).atStartOf(${haystack}):`,()=>{
        const r=new BnfRange(needleStart,needleEnd);
        const w=new WindowStr(haystack);
        const m=r.atStartOf(w);
        if (expectRem!==undefined) {
            assert.is(m.fail,false);
            assert.is(m.remain?.toString(),expectRem);
            assert.is(m.result?.value.toString(),expectMatch);
        } else {
            assert.is(m.fail,true);
        }
    });
}

tsts('Fragile[debug] tests:',()=>{
    const range=new BnfRange("a","z");
    assert.is(range.toString(),'"a"-"z"');
    //Range cannot include an insensitive element
});

tsts.run();