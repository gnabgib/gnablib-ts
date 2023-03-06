import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { WindowStr } from '../../src/primitive/WindowStr.js';
import { InsensitiveMatch, CharMatch, Nfa } from '../../src/algo/nfa/index.js';

const tsts = suite('Thompson NFA');

const testEmpty:{
    str:string,
    expect:number
}[]=[
    {str:'',expect:0},
    {str:'a',expect:0},
    {str:'ab',expect:0},
];
for (const {str,expect} of testEmpty) {
    const n=new Nfa();
    //n.debug=true;
    tsts(`// search(${str}):`,()=>{
        const w=new WindowStr(str);
        assert.is(n.search(w),expect);
    });
}

const test_a:{
    str:string,
    expect:number
}[]=[
   {str:'',expect:-1},
   {str:'a',expect:1},
   {str:'aa',expect:1},
   {str:'ab',expect:1},
];
for (const {str,expect} of test_a) {
    const n=new Nfa().concat(new CharMatch('a'));
    //n.debug=true;
    tsts(`/a/ search(${str}):`,()=>{
        const w=new WindowStr(str);
        assert.is(n.search(w),expect);
    });
}

const test_aOptional:{
    str:string,
    expect:number
}[]=[
    {str:'',expect:0},
    {str:'a',expect:1},
    {str:'aa',expect:1},
    {str:'aaaaa',expect:1},
    {str:'ab',expect:1},
    {str:'bb',expect:0},
    {str:'ba',expect:0},
];
for (const {str,expect} of test_aOptional) {
    const n=new Nfa().concat(new CharMatch('a')).zeroOrOne();
    //n.debug=true;
    tsts(`/a?/ search(${str}):`,()=>{
        const w=new WindowStr(str);
        assert.is(n.search(w),expect);
    });
}

const test_aStar:{
    str:string,
    expect:number
}[]=[
    {str:'',expect:0},
    {str:'a',expect:1},
    {str:'aa',expect:2},
    {str:'aaaaa',expect:5},
    {str:'ab',expect:1},
    {str:'bb',expect:0},
    {str:'ba',expect:0},
];
for (const {str,expect} of test_aStar) {
    const n=new Nfa().concat(new CharMatch('a')).zeroOrMore();
    //n.debug=true;
    tsts(`/a*/ search(${str}):`,()=>{
        const w=new WindowStr(str);
        assert.is(n.search(w),expect);
    });
}

const test_aPlus:{
    str:string,
    expect:number
}[]=[
    {str:'',expect:-1},
    {str:'a',expect:1},
    {str:'aa',expect:2},
    {str:'aaaaa',expect:5},
    {str:'ab',expect:1},
    {str:'bb',expect:-1},
    {str:'ba',expect:-1},
];
for (const {str,expect} of test_aPlus) {
    const n=new Nfa().concat(new CharMatch('a')).oneOrMore();
    //n.debug=true;
    tsts(`/a+/ search(${str}):`,()=>{
        const w=new WindowStr(str);
        assert.is(n.search(w),expect);
    });
}

const test_a_b:{
    str:string,
    expect:number
}[]=[
    {str:'',expect:-1},
    {str:'a',expect:-1},
    {str:'aa',expect:-1},
    {str:'ab',expect:2},
    {str:'abab',expect:2},
    {str:'bb',expect:-1},
    {str:'ba',expect:-1},
];
for (const {str,expect} of test_a_b) {
    const n=new Nfa().concat(new CharMatch('a')).concat(new CharMatch('b'));
    //n.debug=true;
    tsts(`/ab/ search(${str}):`,()=>{
        const w=new WindowStr(str);
        assert.is(n.search(w),expect);
    });
}

const test_aAPlus:{
    str:string,
    expect:number
}[]=[
    {str:'',expect:-1},
    {str:'a',expect:1},
    {str:'aa',expect:2},
    {str:'ab',expect:1},
    {str:'ba',expect:-1},
    {str:'A',expect:1},
    {str:'aA',expect:2},
    {str:'Ab',expect:1},
    {str:'aAaAb',expect:4},
];
for (const {str,expect} of test_aAPlus) {
    const n=new Nfa().concat(new InsensitiveMatch('a')).oneOrMore();
    //n.debug=true;
    tsts(`/a+/i search(${str}):`,()=>{
        const w=new WindowStr(str);
        assert.is(n.search(w),expect);
    });
}

const test_aAPlus_b:{
    str:string,
    expect:number
}[]=[
    {str:'',expect:-1},
    {str:'a',expect:-1},
    {str:'aa',expect:-1},
    {str:'ab',expect:2},
    {str:'ba',expect:-1},
    {str:'A',expect:-1},
    {str:'aA',expect:-1},
    {str:'Ab',expect:2},
    {str:'aAaAb',expect:5},
];
for (const {str,expect} of test_aAPlus_b) {
    const n=new Nfa().concat(new InsensitiveMatch('a')).oneOrMore().concat(new CharMatch('b'));
    //n.debug=true;
    tsts(`/[aA]+b/ search(${str}):`,()=>{
        const w=new WindowStr(str);
        assert.is(n.search(w),expect);
    });
}

const test_a_or_b:{
    str:string,
    expect:number
}[]=[
    {str:'',expect:-1},
    {str:'a',expect:1},
    {str:'aa',expect:1},
    {str:'ab',expect:1},
    {str:'ba',expect:1},
    {str:'A',expect:-1},
    {str:'aA',expect:1},
    {str:'Ab',expect:-1},
];
for (const {str,expect} of test_a_or_b) {
    const n=new Nfa().union(
        new CharMatch('a'),
        new CharMatch('b')
    );
    //n.debug=true;
    tsts(`/(a|b)/ search(${str}):`,()=>{
        const w=new WindowStr(str);
        assert.is(n.search(w),expect);
    });
}

const test_a_or_b_or_c_plus:{
    str:string,
    expect:number
}[]=[
    {str:'',expect:-1},
    {str:'a',expect:1},
    {str:'aa',expect:2},
    {str:'ab',expect:2},
    {str:'ba',expect:2},
    {str:'A',expect:-1},
    {str:'aA',expect:1},
    {str:'Ab',expect:-1},
    {str:'cba',expect:3},
    {str:'ccbbbaaaad',expect:9},
    {str:'bad',expect:2},
    {str:'dad',expect:-1},
    {str:'aad',expect:2},
];
for (const {str,expect} of test_a_or_b_or_c_plus) {
    const n=new Nfa().union(
        new CharMatch('a'),
        new CharMatch('b'),
        new CharMatch('c'),
    ).oneOrMore();
    //n.debug=true;
    tsts(`/(a|b|c)+/ search(${str}):`,()=>{
        const w=new WindowStr(str);
        assert.is(n.search(w),expect);
    });
}

const test_a_or_b_star_c:{
    str:string,
    expect:number
}[]=[
    {str:'',expect:-1},
    {str:'a',expect:-1},
    {str:'b',expect:-1},
    {str:'c',expect:1},
    {str:'ac',expect:2},
    {str:'abab',expect:-1},
    {str:'ababc',expect:5},
    {str:'bbc',expect:3},
    {str:'abc',expect:3},
    {str:'aaaaaaac',expect:8},
    {str:'bac',expect:3},
];
for (const {str,expect} of test_a_or_b_star_c) {
    const n=new Nfa().union(
        new CharMatch('a'),
        new CharMatch('b')
    ).zeroOrMore().concat(new CharMatch('c'));
    //n.debug=true;
    tsts(`/(?:a|b)*c/ search(${str}):`,()=>{
        const w=new WindowStr(str);
        assert.is(n.search(w),expect);
    });
}

const test_abc_or_def:{
    str:string,
    expect:number
}[]=[
    {str:'',expect:-1},
    {str:'ab',expect:-1},
    {str:'abc',expect:3},
    {str:'def',expect:3},
    {str:'ef',expect:-1},
];
for (const {str,expect} of test_abc_or_def) {
    const a=new Nfa().concat(new CharMatch('a'),new CharMatch('b'),new CharMatch('c'));
    const d=new Nfa().concat(new CharMatch('d'),new CharMatch('e'),new CharMatch('f'));
    const n=new Nfa().union(a,d);
    //console.log(n);
    //n.debug=true;
    tsts(`/abc|def/ search(${str}):`,()=>{
        const w=new WindowStr(str);
        assert.is(n.search(w),expect);
    });
}

const test_a__bStar_or_c:{
    str:string,
    expect:number
}[]=[
    {str:'',expect:-1},
    {str:'a',expect:1},
    {str:'ab',expect:2},
    {str:'ac',expect:2},
    {str:'abc',expect:2},
    {str:'acc',expect:2},
    {str:'abbbb',expect:5},
];
for (const {str,expect} of test_a__bStar_or_c) {
    const b=new Nfa().concat(new CharMatch('b')).zeroOrMore();
    const b_or_c=new Nfa().union(b,new CharMatch('c'));
    const n=new Nfa().concat(new CharMatch('a'),b_or_c);
    //console.log(n);
    //n.debug=true;
    tsts(`/a(b*|c)/ search(${str}):`,()=>{
        const w=new WindowStr(str);
        assert.is(n.search(w),expect);
    });
}

const test_4a:{
    str:string,
    expect:number
}[]=[
    {str:'',expect:-1},
    {str:'a',expect:-1},
    {str:'aa',expect:-1},
    {str:'aa',expect:-1},
    {str:'aaa',expect:-1},
    {str:'aaaa',expect:4},
    {str:'aaaaa',expect:4},
    {str:'bb',expect:-1},
    {str:'ba',expect:-1},
];
for (const {str,expect} of test_4a) {
    //Close to the paper's test
    const n=new Nfa().repeat(new CharMatch('a'),4);
    //n.debug=true;
    tsts(`/a{4}/ search(${str}):`,()=>{
        const w=new WindowStr(str);
        assert.is(n.search(w),expect);
    });
}

const test_APlus_20a:{
    str:string,
    expect:number
}[]=[
    {str:'',expect:-1},
    {str:'a',expect:-1},
    {str:'aaaaaaaaaa'+'aaaaaaaaa',expect:-1},
    {str:'aaaaaaaaaa'+'aaaaaaaaaa',expect:-1},
    {str:'aaaaaaaaaa'+'aaaaaaaaaa'+'a',expect:21},
    {str:'aaaaaaaaaa'+'aaaaaaaaaa'+'aa',expect:22},
    {str:'aaaaaaaaaa'+'aaaaaaaaaa'+'aaa',expect:23},
    {str:'aaaaaaaaaa'+'aaaaaaaaaa'+'aaaa',expect:24},
    {str:'aaaaaaaaaa'+'aaaaaaaaaa'+'aaaaaa',expect:26},
    {str:'aaaaaaaaaa'+'aaaaaaaaaa'+'aaaaaaaaaa',expect:30},
];
for (const {str,expect} of test_APlus_20a) {
    //Close to the paper's test
    const a_plus=new Nfa().concat(new CharMatch('a')).oneOrMore();
    const a_20=new Nfa().repeat(new CharMatch('a'),20);
    const n=new Nfa().concat(a_plus,a_20);
    // console.log(n);
    //n.debug=true;
    tsts(`/a+a{20}/ search(${str}):`,()=>{
        const w=new WindowStr(str);
        assert.is(n.search(w),expect);
    });
}

const test_aStar_b:{
    str:string,
    expect:number
}[]=[
    {str:'',expect:-1},
    {str:'a',expect:-1},
    {str:'b',expect:1},
    {str:'abc',expect:2},
    {str:'aaaaaaaaaa'+'aaaaaaaaaa',expect:-1},
    {str:'aaaaaaaaaa'+'aaaaaaaaab',expect:20},
    {str:'aaaaaaaaaa'+'b',expect:11},
    {str:'bbbbbbbbbb'+'aaaaaaaaaa',expect:1},
];
for (const {str,expect} of test_aStar_b) {
    //Close to the paper's test
    const a_star=new Nfa().concat(new CharMatch('a')).zeroOrMore();
    const b=new Nfa().concat(new CharMatch('b'));
    const n=new Nfa().concat(a_star,b);
    // console.log(n);
    // n.debug=true;
    tsts(`/a*b/ search(${str}):`,()=>{
        const w=new WindowStr(str);
        assert.is(n.search(w),expect);
    });
}

const test_aStar_bStar_cStar:{
    str:string,
    expect:number
}[]=[
    {str:'',expect:0},
    {str:'a',expect:1},
    {str:'abc',expect:3},
    {str:'abcccccccc',expect:10},
    {str:'aaaaaaaabc',expect:10},
    {str:'abbbbbbbbc',expect:10},
    {str:'abcccccccc and other',expect:10},
    {str:'aaaaaaaabc and other',expect:10},
    {str:'abbbbbbbbc and other',expect:10},
    {str:'bca',expect:2},
    {str:'cba',expect:1},
    {str:'cca',expect:2},
    {str:'aaaaaaaaaa'+'aaaaaaaaaa',expect:20},
    {str:'aaaaaaaaaa'+'bbbbbbbbbb',expect:20},
    {str:'aaaaaaaaaa'+'bbbbbbbbbb'+'cccccccccc',expect:30},
    {str:'aaaaaaaaaa'+'cccccccccc',expect:20},
    {str:'bbbbbbbbbb'+'aaaaaaaaaa',expect:10},
    {str:'cccccccccc'+'bbbbbbbbbb'+'aaaaaaaaaa',expect:10},
    {str:'cccccccccc'+'aaaaaaaaaa',expect:10},
    {str:'cccccccccc'+'bbbbbbbbbb'+'aaaaaaaaaa',expect:10},
];
for (const {str,expect} of test_aStar_bStar_cStar) {
    //Close to the paper's test
    const a_star=new Nfa().concat(new CharMatch('a')).zeroOrMore();
    const b_star=new Nfa().concat(new CharMatch('b')).zeroOrMore();
    const c_star=new Nfa().concat(new CharMatch('c')).zeroOrMore();
    const n=new Nfa().concat(a_star,b_star,c_star);
    // console.log(a_star);
    // console.log(n);
    // n.debug=true;
    tsts(`/a*b*c*/ search(${str}):`,()=>{
        const w=new WindowStr(str);
        assert.is(n.search(w),expect);
    });
}

const test_aOpt32:{
    str:string,
    expect:number
}[]=[
    {str:'',expect:0},
    {str:'a',expect:1},
    {str:'aaaaaaaaaa',expect:10},
    {str:'aaaaaaaaaa'+'aaaaaaaaaa',expect:20},
    {str:'aaaaaaaaaa'+'aaaaaaaaaa'+'aaaaaaaaaa',expect:23},
];
for (const {str,expect} of test_aOpt32) {
    tsts(`a?^23 search(${str}):`,()=>{
        const n=new Nfa().repeat(new CharMatch('a'),0,23);
        const w=new WindowStr(str);
        assert.is(n.search(w),expect);
    });
}

tsts(`a?^23a^23 search(a^23):`,()=>{
    const n=new Nfa().repeat(new CharMatch('a'),0,23).concat(new Nfa().repeat(new CharMatch('a'),23));
    const w=new WindowStr('aaaaaaaaaa'+'aaaaaaaaaa'+'aaa');
    //console.log(n);
    assert.is(n.search(w),23);
});

tsts.run();
