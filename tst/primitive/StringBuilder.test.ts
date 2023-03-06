import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { StringBuilder } from '../../src/primitive/StringBuilder';

const tsts = suite('StringBuilder');

const testAppend:{
    start:string,
    append:string,
    expectLen:number,
    expectStr:string
}[]=[
    {start:"",append:"",expectLen:0,expectStr:''},
    {start:"",append:"hello",expectLen:5,expectStr:'hello'},
    {start:"",append:"hi there",expectLen:8,expectStr:'hi there'},
];
for(const {start,append,expectLen,expectStr} of testAppend) {
    tsts(`append:`,()=>{
        const s=new StringBuilder();
        s.append(start);
        assert.is(s.length,start.length);
        s.append(append);
        assert.is(s.length,expectLen);
        assert.is(s.toString(),expectStr);
    });
}

const testAppendLine:{
    start:string,
    append:string,
    expectLen:number,
    expectStr:string
}[]=[
    {start:"",append:"hello",expectLen:6,expectStr:'hello\n'},
];
for(const {start,append,expectLen,expectStr} of testAppendLine) {
    tsts(`SB(${start}).appendLine(${append}):`,()=>{
        const s=new StringBuilder();
        s.append(start);
        assert.is(s.length,start.length,'setup length ok');
        s.appendLine(append);
        assert.is(s.length,expectLen,'length after append');
        assert.is(s.toString(),expectStr,'final value');
    });
}

tsts(`appendLine (alt encoding):`,()=>{
    const s=new StringBuilder("\r\n");
    s.appendLine("hi")
    assert.is(s.length,4);
    assert.is(s.toString(),"hi\r\n");
});

tsts('clear:',()=>{
    const s=new StringBuilder();
    s.append('hi');
    s.append(' there')
    assert.is(s.length,8);
    assert.is(s.toString(),'hi there');
    s.clear();
    assert.is(s.length,0);
});

const testCutLast:{
    start:string[],
    cut:number,
    expectLen:number,
    expectStr:string
}[]=[
    {start:['start,middle,end,'],cut:1,expectLen:16,expectStr:'start,middle,end'},
    {start:['start,middle,end,'],cut:5,expectLen:12,expectStr:'start,middle'},
    {start:'a,b,c,d,e'.split(','),cut:3,expectLen:2,expectStr:'ab'},
];
for(const {start,cut,expectLen,expectStr} of testCutLast) {
    tsts(`Sb(${start}).cutLast(${cut}):`,()=>{
        const s=new StringBuilder();
        //This means each string is in a different array element (we know this is how it's mapped internally)
        for(const str of start) s.append(str);
        assert.is(s.length,start.join('').length,'setup length ok');
        s.cutLast(cut);
        assert.is(s.length,expectLen,'cut length');
        assert.is(s.toString(),expectStr,'final value');
    });
}

tsts.run();
