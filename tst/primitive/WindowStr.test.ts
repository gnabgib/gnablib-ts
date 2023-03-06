import { suite } from 'uvu';
import {WindowStr} from "../../src/primitive/WindowStr.js";
import * as assert from 'uvu/assert';

const tsts = suite('WindowStr');

const buildTests:{
    str:string|WindowStr,
    start?:number,
    len?:number,
    expect:string
}[]=[
    {str:'Hello',expect:'Hello'},
    {str:'Hello',start:0,expect:'Hello'},
    {str:'Hello',start:1,expect:'ello'},
    {str:'Hello',start:2,expect:'llo'},
    {str:'Hello',start:3,expect:'lo'},
    {str:'Hello',start:4,expect:'o'},
    {str:'Hello',start:5,expect:''},
    {str:'Hello',len:5,expect:'Hello'},
    {str:'Hello',len:4,expect:'Hell'},
    {str:'Hello',len:3,expect:'Hel'},
    {str:'Hello',len:2,expect:'He'},
    {str:'Hello',len:1,expect:'H'},
    {str:'Hello',len:0,expect:''},
    {str:'[Hello]',start:1,len:5,expect:'Hello'},
    {str:new WindowStr('[Hello]',1,5),expect:'Hello'},
];
for (const {str,start,len,expect} of buildTests) {
    tsts(`new WindowStr(${str},${start},${len}):`,()=>{
        const w=new WindowStr(str,start,len);
        assert.is(w.toString(),expect);
    });
}

const badBuildTests:{
    str:string,
    start?:number,
    end?:number,
}[]=[
    {str:'Hello',start:-1},//Start out of range
    {str:'Hello',start:6},//Start out of range
    {str:'Hello',start:1.1},//Start not an int
    {str:'Hello',end:-1},//End out of range
    {str:'Hello',end:6},//End out of range
];
for (const {str,start,end} of badBuildTests) {
    tsts(`THROWS: new WindowStr(${str},${start},${end}):`,()=>{
        assert.throws(()=>new WindowStr(str,start,end))
    });
}

const charAtTests:{
    str:string|WindowStr,
    idx:number,
    expect:string
}[]=[
    {str:'Hello',idx:0,expect:'H'},
    {str:'Hello',idx:1,expect:'e'},
    {str:'Hello',idx:4,expect:'o'},
    {str:'Hello',idx:-1,expect:'o'},
    {str:'Hello',idx:-2,expect:'l'},
    {str:'Hello',idx:-4,expect:'e'},
    {str:'Hello',idx:-5,expect:'H'},
    {str:new WindowStr('[Hello]',1,5),idx:0,expect:'H'},
    {str:new WindowStr('[Hello]',1,5),idx:-1,expect:'o'},
];
for (const {str,idx,expect} of charAtTests) {
    tsts(`WindowStr(${str}).charAt(${idx}):`,()=>{
        const w=new WindowStr(str);
        assert.is(w.charAt(idx),expect);
    });
}
const badCharAtTests:{
    str:string|WindowStr,
    idx:number
}[]=[
    {str:'Hello',idx:-6},
    {str:'Hello',idx:5},
    {str:'Hello',idx:20},
    {str:new WindowStr('[Hi]',1,2),idx:-3},
    {str:new WindowStr('[Hi]',1,2),idx:2},
];
for(const {str,idx} of badCharAtTests) {
    tsts(`THROWS: WindowStr(${str}).charAt(${idx}):`,()=>{
        const w=new WindowStr(str);
        assert.throws(()=>w.charAt(idx));
    });
}

const endsWithTests:{
    str:string|WindowStr,
    search:string,
    expect:boolean
}[]=[
    {str:'Hello',search:'o',expect:true},
    {str:'Hello',search:'lo',expect:true},
    {str:'Hello',search:'llo',expect:true},
    {str:'Hello',search:'ello',expect:true},
    {str:'Hello',search:'Hello',expect:true},
    {str:'Hello',search:'Hell',expect:false},
    {str:'Hello',search:'Hel',expect:false},
    {str:'Hello',search:'He',expect:false},
    {str:'Hello',search:'H',expect:false},
    {str:'Hello',search:'',expect:true},//Stupid feature
    {str:new WindowStr('[Hello]',1,5),search:'lo',expect:true},
    {str:new WindowStr('[Hello]',1,5),search:'o]',expect:false},//Doesn't leak parent
    {str:new WindowStr('[Hello]',1,5),search:'He',expect:false},
    {str:new WindowStr('[Hello]',1,5),search:'[H',expect:false},
];
for (const {str, search,expect} of endsWithTests) {
    tsts(`WindowStr(${str}).endsWith(${search}):`,()=>{
        const w=new WindowStr(str);
        assert.is(w.endsWith(search),expect);
    });
}

const indexOfTests:{
    str:string|WindowStr,
    search:string,
    start?:number,
    expect:number
}[]=[
    {str:'do re mi fa so la ti',search:'do',expect:0},
    {str:'do re mi fa so la ti',search:'re',expect:3},
    {str:'do re mi fa so la ti',search:'re',start:3,expect:3},
    {str:'do re mi fa so la ti',search:'re',start:4,expect:-1},
    {str:'do re mi fa so la ti',search:'ti',expect:18},
    {str:new WindowStr('do re mi fa so la ti',3,14),search:'re',expect:0},
    {str:new WindowStr('do re mi fa so la ti',3,14),search:'re',start:1,expect:-1},
    {str:new WindowStr('do re mi fa so la ti',3,14),search:'do',expect:-1},
    {str:new WindowStr('do re mi fa so la ti',3,14),search:'ti',expect:-1},//out of bounds
    {str:new WindowStr('do re mi fa so la ti',3,14),search:'la',expect:12},// "
    {str:new WindowStr('do re mi fa so la ti',3,14),search:'la ',expect:-1}, //Overlaps end boundary
    {str:'doh doh',search:'doh',expect:0},
    {str:'doh doh',search:'doh',start:1,expect:4},
    {str:'doh doh',search:'doh',start:2,expect:4},
    {str:'doh doh',search:'doh',start:3,expect:4},
    {str:'doh doh',search:'doh',start:4,expect:4},
    {str:'doh doh',search:'doh',start:5,expect:-1},
    {str:'doh doh',search:'doh',start:6,expect:-1},
];
for (const {str,search,start,expect} of indexOfTests) {
    tsts(`WindowStr(${str}).indexOf(${search},${start}):`,()=>{
        const w=new WindowStr(str);
        assert.is(w.indexOf(search,start),expect);
    });
}

const badIndexOfTests:{
    str:string|WindowStr,
    search:string,
    start:number
}[]=[
    {str:'Hello',search:'ll',start:-1},
    {str:new WindowStr('do re mi fa so la ti',3,14),search:'do',start:-3},//Cannot escape child window
];
for (const {str,search,start} of badIndexOfTests) {
    tsts(`THROWS: WindowStr(${str}).indexOf(${search},${start}):`,()=>{
        const w=new WindowStr(str);
        assert.throws(()=>w.indexOf(search,start));
    });
}

const lastIndexOfTests:{
    str:string|WindowStr,
    search:string,
    length?:number,
    expect:number
}[]=[
    {str:'do re mi fa so la ti',search:'do',expect:0},
    {str:'do re mi fa so la ti',search:'re',expect:3},
    {str:'do re mi fa so la ti',search:'re',length:3,expect:-1},
    {str:'do re mi fa so la ti',search:'re',length:4,expect:-1},
    {str:'do re mi fa so la ti',search:'re',length:5,expect:3},
    {str:'do re mi fa so la ti',search:'ti',expect:18},
    {str:new WindowStr('do re mi fa so la ti',3,14),search:'re',expect:0},
    {str:new WindowStr('do re mi fa so la ti',3,14),search:'re',length:0,expect:-1},
    {str:new WindowStr('do re mi fa so la ti',3,14),search:'re',length:1,expect:-1},
    {str:new WindowStr('do re mi fa so la ti',3,14),search:'re',length:2,expect:0},
    {str:new WindowStr('do re mi fa so la ti',3,14),search:'do',expect:-1},
    {str:new WindowStr('do re mi fa so la ti',3,14),search:'ti',expect:-1},//out of bounds
    {str:new WindowStr('do re mi fa so la ti',3,14),search:'la',expect:12},// "
    {str:new WindowStr('do re mi fa so la ti',3,14),search:'la ',expect:-1},//Overlaps end boundary
    {str:'doh doh',search:'doh',expect:4},
    {str:'doh doh',search:'doh',length:7,expect:4},
    {str:'doh doh',search:'doh',length:6,expect:0},//only do in second
    {str:'doh doh',search:'doh',length:5,expect:0},
    {str:'doh doh',search:'doh',length:4,expect:0},
    {str:'doh doh',search:'doh',length:3,expect:0}, 
    {str:'doh doh',search:'doh',length:2,expect:-1},//only do in first
    {str:'doh doh',search:'doh',length:1,expect:-1}, 
    {str:'doh doh',search:'doh',length:0,expect:-1}, 
];
for (const {str,search,length,expect} of lastIndexOfTests) {
    tsts(`WindowStr(${str}).lastIndexOf(${search},${length}):`,()=>{
        const w=new WindowStr(str);
        assert.is(w.lastIndexOf(search,length),expect);
    });
}

const leftTests:{
    str:string|WindowStr,
    len:number,
    expect:string
}[]=[
    {str:'Hello',len:0,expect:''},
    {str:'Hello',len:1,expect:'H'},
    {str:'Hello',len:2,expect:'He'},
    {str:'Hello',len:3,expect:'Hel'},
    {str:'Hello',len:4,expect:'Hell'},
    {str:'Hello',len:5,expect:'Hello'},
    {str:new WindowStr('[Hello]',1,5),len:5,expect:'Hello'},
    {str:new WindowStr('[Hello]',1,5),len:2,expect:'He'},
];
for (const {str,len, expect} of leftTests) {
    tsts(`WindowStr(${str}).left(${len}):`,()=>{
        const w=new WindowStr(str);
        const l=w.left(len);
        assert.is(l.toString(),expect);
    });
}

const badLeftTests:{
    str:string|WindowStr,
    len:number
}[]=[
    {str:'Hello',len:6},
    {str:'Hello',len:20},
    {str:new WindowStr('[Hello]',1,5),len:6},
];
for(const {str,len} of badLeftTests) {
    tsts(`THROWS: WindowStr(${str}).left(${len}):`,()=>{
        const w=new WindowStr(str);
        assert.throws(()=>w.left(len));
    });
}

tsts(`peerOf():`,()=>{
    const hello=new WindowStr('hello');
    //Ways to share the same data:
    //const helloShared=hello.left(0);
    //const helloShared=hello.right(5);
    const helloShared=hello.sub(0);
    assert.is(helloShared.peerOf(hello),true);
    assert.is(hello.peerOf(helloShared),true);
    assert.is(helloShared.stringEqual(hello),true);
    assert.is(hello.stringEqual(helloShared),true);

    //Identical content but not from the same source:
    //const helloOther=new WindowStr(hello.toString());
    const helloOther=new WindowStr('hello');
    assert.is(hello.peerOf(helloOther),false);
    assert.is(helloOther.peerOf(hello),false);
    assert.is(helloOther.stringEqual(hello),true);
    assert.is(hello.stringEqual(helloOther),true);

    //Effective same content
    const helloSubset=new WindowStr('[hello]',1,5);
    assert.is(hello.peerOf(helloSubset),false);
    assert.is(helloSubset.peerOf(hello),false);
    assert.is(helloSubset.stringEqual(hello),true);
    assert.is(hello.stringEqual(helloOther),true);

});

const rightTests:{
    str:string|WindowStr,
    len:number,
    expect:string
}[]=[
    {str:'Hello',len:0,expect:''},
    {str:'Hello',len:1,expect:'o'},
    {str:'Hello',len:2,expect:'lo'},
    {str:'Hello',len:3,expect:'llo'},
    {str:'Hello',len:4,expect:'ello'},
    {str:'Hello',len:5,expect:'Hello'},
    {str:new WindowStr('[Hello]',1,5),len:5,expect:'Hello'},
    {str:new WindowStr('[Hello]',1,5),len:2,expect:'lo'},
];
for (const {str,len,expect} of rightTests) {
    tsts(`WindowStr(${str}).right(${len}):`,()=>{
        const w=new WindowStr(str);
        const r=w.right(len);
        assert.is(r.toString(),expect);
    });
}

const badRightTests:{
    str:string|WindowStr,
    len:number
}[]=[
    {str:'Hello',len:6},
    {str:'Hello',len:20},
    {str:new WindowStr('[Hello]',1,5),len:6},
];
for(const {str,len} of badRightTests) {
    tsts(`THROWS: WindowStr(${str}).right(${len}):`,()=>{
        const w=new WindowStr(str);
        assert.throws(()=>w.right(len));
    });
}

const splitTests:{
    str:string,
    sep:string,
    limit?:number,
    expect:string[]
}[]=[
    {str:'The quick brown!',sep:' ',expect:['The','quick','brown!']},
    {str:'The quick brown!',sep:' ',limit:0,expect:[]},
    {str:'The quick brown!',sep:' ',limit:2,expect:['The','quick']},
    {str:'The quick brown!',sep:'?',expect:['The quick brown!']},
    {str:'The quick brown!',sep:'!',expect:['The quick brown','']},
    {str:'The quick brown!',sep:'',expect:[]},//Empty sep isn't supported
];
for(const {str,sep,limit,expect} of splitTests) {
    tsts(`WindowStr(${str}).split(${sep},${limit}):`,()=>{
        const w=new WindowStr(str);
        const s=w.split(sep,limit);
        assert.is(s.length,expect.length,'Result size matches');
        for(let i=0;i<expect.length;i++) {
            assert.is(s[i].toString(),expect[i]);
        }
    });
}

const startsWithTests:{
    str:string|WindowStr,
    search:string,
    expect:boolean
}[]=[
    {str:'Hello',search:'o',expect:false},
    {str:'Hello',search:'lo',expect:false},
    {str:'Hello',search:'llo',expect:false},
    {str:'Hello',search:'ello',expect:false},
    {str:'Hello',search:'Hello',expect:true},
    {str:'Hello',search:'Hell',expect:true},
    {str:'Hello',search:'Hel',expect:true},
    {str:'Hello',search:'He',expect:true},
    {str:'Hello',search:'H',expect:true},
    {str:'Hello',search:'',expect:true},//Stupid feature
    {str:new WindowStr('[Hello]',1,5),search:'lo',expect:false},
    {str:new WindowStr('[Hello]',1,5),search:'o]',expect:false},
    {str:new WindowStr('[Hello]',1,5),search:'He',expect:true},
    {str:new WindowStr('[Hello]',1,5),search:'[H',expect:false},//Doesn't leak parent
];
for (const {str,search,expect} of startsWithTests) {
    tsts(`WindowStr(${str}).startsWith(${search}):`,()=>{
        const w=new WindowStr(str);
        assert.is(w.startsWith(search),expect);
    });
}

const subTests:{
    str:string,
    start:number,
    len?:number,
    expect:string
}[]=[
    {str:"Hello",start:0,expect:"Hello"},
    {str:"Hello",start:1,expect:"ello"},
    {str:"Hello",start:2,expect:"llo"},
    {str:"Hello",start:3,expect:"lo"},
    {str:"Hello",start:4,expect:"o"},
    {str:"Hello",start:5,expect:""},
    {str:"Hello",start:-5,expect:"Hello"},
    {str:"Hello",start:-4,expect:"ello"},
    {str:"Hello",start:-3,expect:"llo"},
    {str:"Hello",start:-2,expect:"lo"},
    {str:"Hello",start:-1,expect:"o"},

    {str:"Hello",start:0,len:0,expect:""},
    {str:"Hello",start:1,len:1,expect:"e"},
    {str:"Hello",start:1,len:2,expect:"el"},
    {str:"Hello",start:1,len:3,expect:"ell"},
    {str:"Hello",start:1,len:4,expect:"ello"},
];
for(const {str,start,len,expect} of subTests) {
    tsts(`WindowStr(${str}).sub(${start},${len}):`,()=>{
        const w=new WindowStr(str);
        const clone=w.sub(start,len);
        assert.is(clone.toString(),expect);
    });
}

const badSubTests:{
    str:string,
    start:number,
    len?:number,
}[]=[
    {str:'Hello',start:6},
    {str:'Hello',start:-6},
    {str:'Hello',start:1,len:5},
    //{str:'Hello',len:20},
];
for(const {str,start,len} of badSubTests) {
    tsts(`THROWS: WindowStr(${str}).sub(${start},${len}):`,()=>{
        const w=new WindowStr(str);
        assert.throws(()=>w.sub(start,len));
    });
}

tsts("WindowStr(Hi).toPrimitive()",()=>{
    //Tests Browser debug, and string concats
    const w=new WindowStr('Hi');
    assert.is(String(w),'WindowStr(Hi)');
});

tsts('WindowStr(Hello£) -integrated',()=>{
    const w=new WindowStr('Hello£');
    assert.is(w.length,6);
    assert.is(w.empty,false);
    assert.is(w.charCodeAt(0),72);
    assert.is(w.charCodeAt(5),163);
});


tsts.run();