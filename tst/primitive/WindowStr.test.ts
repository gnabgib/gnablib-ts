import { suite } from 'uvu';
import { WindowStr } from '../../src/primitive/WindowStr';
import * as assert from 'uvu/assert';
import util from 'util';

const tsts = suite('WindowStr');

const buildSet:[string,number|undefined,number|undefined,string][]=[
	['Hello',undefined,undefined,'Hello'],
	['Hello',0,undefined,'Hello'],
	['Hello',1,undefined,'ello'],
	['Hello',2,undefined,'llo'],
	['Hello',3,undefined,'lo'],
	['Hello',4,undefined,'o'],
	['Hello',5,undefined,''],
	['Hello',undefined,5,'Hello'],
	['Hello',undefined,4,'Hell'],
	['Hello',undefined,3,'Hel'],
	['Hello',undefined,2,'He'],
	['Hello',undefined,1,'H'],
	['Hello',undefined,0,''],
	['!Hello!',1,5,'Hello'],
];
for(const [str,start,len,expect] of buildSet) {
	tsts(`new(${str},${start},${len}):`, () => {
		const w = WindowStr.new(str, start, len);
		assert.is(w.toString(), expect);
	});
}

tsts(`build with null or undefined ok`,()=>{
	// @ts-expect-error: We're just checking robustness
	const wu=WindowStr.new(undefined);
	// @ts-expect-error: We're just checking robustness
	const wn=WindowStr.new(null);
	assert.is(wu.length,0);
	assert.is(wn.length,0);
})

const badBuildSet:[string,number|undefined,number|undefined][]=[
	['Hello',-1,undefined],//Too early
	['Hello',6,undefined],//Too late
	['Hello',undefined,-1],//Too short
	['Hello',undefined,6],//Too long
];
for (const [ str, start, len ] of badBuildSet) {
	tsts(`new(${str},${start},${len}) throws`, () => {
		assert.throws(() => WindowStr.new(str, start, len));
	});
}

const emptySet:[WindowStr,number,boolean][]=[
	[WindowStr.new(''),0,true],
	[WindowStr.new('Hi'),2,false],
	[WindowStr.new('Hi',2),0,true],
];
for(const [w,expectLen,expectEmpty] of emptySet) {
	tsts(`${w.debug()}.isEmpty`,()=>{
		assert.is(w.empty,expectEmpty);
		assert.is(w.length,expectLen);
	})
}

const toStringSet:[string,number|undefined,number|undefined,string][]=[
	['Hi there',undefined,,'Hi there'],
	['Bats',1,2,'at'],
];
for(const [str,start,len,expect] of toStringSet) {
	const w=WindowStr.new(str,start,len);
	tsts(`${w.debug()}.toString()`,()=>{
		
		assert.is(w.toString(),expect);
	})	
}

tsts('[Symbol.toStringTag]', () => {
	const w=WindowStr.new('Syntax',0,5);
	const str = Object.prototype.toString.call(w);
	//console.log(str); //[object WindowStr]
	assert.is(str.indexOf('WindowStr') > 0, true);
});

tsts('util.inspect',()=>{
    const w=WindowStr.new('Syntax',0,5);
    const u=util.inspect(w);
	//console.log(u); //WindowStr(Syntax, 0, 5)
    assert.is(u.startsWith('WindowStr('),true);
});

const charAtSet:[WindowStr,number,string][]=[
	[WindowStr.new('Hello'),0,'H'],
	[WindowStr.new('Hello'),1,'e'],
	[WindowStr.new('Hello'),4,'o'],
];
for (const [ w, idx, expect ] of charAtSet) {
	tsts(`${w.debug()}.charAt(${idx}):`, () => {
		assert.is(w.charAt(idx), expect);
	});
}

const badCharAtSet:[string,number][]=[
	['Hello',-1],//Add .length yourself to support back from end indexing
	['Hello',-6],
	['Hello',5],
	['Hello',25],
];
for(const [str,idx] of badCharAtSet) {
	tsts(`${str}.charAt(${idx}) throws`,()=>{
		assert.throws(()=>WindowStr.new(str).charAt(idx));
	})
}

const codePointAtSet:[WindowStr,number,number][]=[
	[WindowStr.new('Hello'),0,72],
	[WindowStr.new('Hi£'),2,163],
	//From MDN
	[WindowStr.new('☃★♲'),1,9733],
	[WindowStr.new('☃★♲',1),0,9733],
	[WindowStr.new('ABC'),0,65],
	[WindowStr.new('😍'),0,128525],
	[WindowStr.new('\ud83d\ude0d'),0,128525],
	[WindowStr.new('😍'),1,56845],
	[WindowStr.new('\ud83d\ude0d'),1,56845],
	[WindowStr.new('\ud83d\ude0d',1),0,56845],
];
for(const [w,pos,expect] of codePointAtSet) {
	tsts(`${w.debug()}.codePointAt(${pos})`,()=>{
		assert.is(w.codePointAt(pos),expect);
	});
}

const badCodePointSet:[WindowStr,number][]=[
	[WindowStr.new('Hello'),-1],//Add .length yourself
	[WindowStr.new('Hello'),5],//Out of range
	[WindowStr.new('a',1),0],
	[WindowStr.new('a',1),10],
];
for(const [w,pos] of badCodePointSet) {
	tsts(`${w.debug()}.codePointAt(${pos}) throws`,()=>{
		assert.throws(()=>w.codePointAt(pos));
	})
}

const endsWithSet: [WindowStr,string,boolean][]=[
	[WindowStr.new('Hello'),'o',true],
	[WindowStr.new('Hello'),'lo',true],
	[WindowStr.new('Hello'),'llo',true],
	[WindowStr.new('Hello'),'ello',true],
	[WindowStr.new('Hello'),'Hello',true],
	[WindowStr.new('Hello'),'Hell',false],
	[WindowStr.new('Hello'),'Hel',false],
	[WindowStr.new('Hello'),'He',false],
	[WindowStr.new('Hello'),'H',false],
	[WindowStr.new('Hello'),'',true],
	[WindowStr.new('[Hello]',1,5),'lo',true],
	[WindowStr.new('[Hello]',1,5),'o',true],
	[WindowStr.new('[Hello]',1,5),'He',false],
	[WindowStr.new('[Hello]',1,5),'H',false],
	//Can't escape window:
	[WindowStr.new('[Hello]',1,5),'o]',false],
	[WindowStr.new('[Hello]',1,5),'[H',false],
];
for(const [w,search,expect] of endsWithSet) {
	tsts(`${w.debug()}.endsWith(${search})`,()=>{
		assert.is(w.endsWith(search),expect);
	})
}

const indexOfSet:[WindowStr,string,number|undefined,number][]=[
	[WindowStr.new('do re mi fa so la ti'),'do',,0],
	[WindowStr.new('do re mi fa so la ti'),'re',,3],
	[WindowStr.new('do re mi fa so la ti'),'re',3,3],
	[WindowStr.new('do re mi fa so la ti'),'re',4,-1],
	[WindowStr.new('do re mi fa so la ti'),'la',,15],
	[WindowStr.new('do re mi fa so la ti'),'ti',,18],
	[WindowStr.new('do re mi fa so la ti',3,14),'re',,0],
	[WindowStr.new('do re mi fa so la ti',3,14),'re',1,-1],
	[WindowStr.new('do re mi fa so la ti',3,14),'do',,-1],
	[WindowStr.new('do re mi fa so la ti',3,14),'ti',,-1],
	[WindowStr.new('do re mi fa so la ti',3,14),'la',,12],
	[WindowStr.new('do re mi fa so la ti',3,14),'la ',,-1],
];
for(const [w,search,start,expect] of indexOfSet) {
	tsts(`${w.debug()}.indexOf(${search},${start})`,()=>{
		assert.is(w.indexOf(search,start),expect);
	})
}

tsts(`indexOf-out of range start throws`,()=>{
	const w=WindowStr.new('Hello');
	assert.throws(()=>w.indexOf('lo',10));
});

const indexOfAnySet:[WindowStr,string[],number|undefined,number][]=[
	[WindowStr.new('2024-01-02'),['-','/','.'],,4],
	[WindowStr.new('2024/01/02'),['-','/','.'],,4],
	[WindowStr.new('2024.01.02'),['-','/','.'],,4],
	[WindowStr.new('-2024-01-02'),['-','/','.'],1,5],
	[WindowStr.new('abba'),['c','d'],,-1],
];
for(const [w,searchs,start,expect] of indexOfAnySet) {
	tsts(`${w.debug()}.indexOfAny(${searchs},${start})`,()=>{
		assert.is(w.indexOfAny(searchs,start),expect);
	})

}

const lastIndexOfSet:[WindowStr,string,number|undefined,number][]=[
	[WindowStr.new('do re mi fa so la ti'),'do',,0],
	[WindowStr.new('do re mi fa so la ti'),'re',,3],
	[WindowStr.new('do re mi fa so la ti'),'re',3,-1],//window not large enough
	[WindowStr.new('do re mi fa so la ti'),'re',4,-1],//window not large enough
	[WindowStr.new('do re mi fa so la ti'),'re',5,3],
	[WindowStr.new('do re mi fa so la ti'),'ti',,18],
	[WindowStr.new('do re mi fa so la ti',3,14),'re',,0],//window-adjusted location
	[WindowStr.new('do re mi fa so la ti',3,14),'re',0,-1],//window not large enough
	[WindowStr.new('do re mi fa so la ti',3,14),'re',1,-1],//window not large enough
	[WindowStr.new('do re mi fa so la ti',3,14),'re',2,0],//window-adjusted location
	[WindowStr.new('do re mi fa so la ti',3,14),'do',,-1],//tries to escape window
	[WindowStr.new('do re mi fa so la ti',3,14),'ti',,-1],//tries to escape window
	[WindowStr.new('do re mi fa so la ti',3,14),'la',,12],//window-adjusted location
	[WindowStr.new('do re mi fa so la ti',3,14),'la ',,-1],//tries to escape window
	[WindowStr.new('doh doh'),'doh',,4],
	[WindowStr.new('doh doh'),'doh',7,4],
	[WindowStr.new('doh doh'),'doh',6,0],
	[WindowStr.new('doh doh'),'doh',5,0],
	[WindowStr.new('doh doh'),'doh',4,0],
	[WindowStr.new('doh doh'),'doh',3,0],
	[WindowStr.new('doh doh'),'doh',2,-1],//window not large enough
	[WindowStr.new('doh doh'),'doh',1,-1],//window not large enough
	[WindowStr.new('doh doh'),'doh',0,-1],//window not large enough
];
for(const [w,search,len,expect] of lastIndexOfSet) {
	tsts(`${w.debug()}.lastIndexOf(${search},${len})`,()=>{
		assert.is(w.lastIndexOf(search,len),expect);
	});	
}

tsts(`lastIndexOf-out of range length throws`,()=>{
	const w=WindowStr.new('Hello');
	assert.throws(()=>w.lastIndexOf('lo',10));
});

const leftSet:[WindowStr,number,string][]=[
	[WindowStr.new('Hello'),0,''],
	[WindowStr.new('Hello'),1,'H'],
	[WindowStr.new('Hello'),2,'He'],
	[WindowStr.new('Hello'),3,'Hel'],
	[WindowStr.new('Hello'),4,'Hell'],
	[WindowStr.new('Hello'),5,'Hello'],
	[WindowStr.new('[Hello]',1,5),5,'Hello'],
	[WindowStr.new('[Hello]',1,5),2,'He'],
];
for(const [w,len,expect] of leftSet) {
	tsts(`${w.debug()}.left(${len})`,()=>{
		assert.is(w.left(len).toString(),expect);
	})
}

tsts(`left-out of range length throws`,()=>{
	const w=WindowStr.new('Hello');
	assert.throws(()=>w.left(10));
});

const matchSet:[WindowStr,RegExp,RegExpMatchArray|null][]=[
	[WindowStr.new('Hello'),/l/g,["l","l"]],
	[WindowStr.new('Hello',3),/l/g,["l"]],
];
for(const [w,re,expect] of matchSet) {
	tsts(`${w.debug()}.match(${re})`,()=>{
		const res=w.match(re);
		assert.equal(res,expect);
	})
}

tsts(`peerOf()`,()=>{
	const hello=WindowStr.new('Hello');
	
	//Ways to share storage:
	const left=hello.left(4);
	assert.not.equal(hello,left,'Different objects');
	assert.is(hello.toString()!=left.toString(),true,'Different content');
	assert.is(hello.peerOf(left),true);
	assert.is(left.peerOf(hello),true);

	const right=hello.right(2);
	assert.not.equal(hello,right,'Different objects');
	assert.is(hello.toString()!=right.toString(),true,'Different content');
	assert.is(hello.peerOf(right),true);
	assert.is(right.peerOf(hello),true);

	const span=hello.span(2,2);
	assert.not.equal(hello,span,'Different objects');
	assert.is(hello.toString()!=span.toString(),true,'Different content');
	assert.is(hello.peerOf(span),true);
	assert.is(span.peerOf(hello),true);

	//Same content doesn't mean same storage
	const hello2=WindowStr.new('[Hello]',1,5);
	//Warning, if you build two String() with the same content, JS may optimize this to
	// the same storage (after all - immutable) so `const hello2=WindowStr2.new('Hello');`
	// literally points to the same memory as `hello` (in v8 anyway) !!danger
	assert.is(hello.toString()==hello2.toString(),true,'Same content');
	assert.is(hello2.peerOf(hello),false,'hello2-peer-hello');
	assert.is(hello.peerOf(hello2),false,'hello-peer-hello2');
})

const rightSet:[WindowStr,number,string][]=[
	[WindowStr.new('Hello'),0,''],
	[WindowStr.new('Hello'),1,'o'],
	[WindowStr.new('Hello'),2,'lo'],
	[WindowStr.new('Hello'),3,'llo'],
	[WindowStr.new('Hello'),4,'ello'],
	[WindowStr.new('Hello'),5,'Hello'],
	[WindowStr.new('[Hello]',1,5),5,'Hello'],
	[WindowStr.new('[Hello]',1,5),2,'lo'],
];
for(const [w,len,expect] of rightSet) {
	tsts(`${w.debug()}.right(${len})`,()=>{
		assert.is(w.right(len).toString(),expect);
	})
}

tsts(`right-out of range length throws`,()=>{
	const w=WindowStr.new('Hello');
	assert.throws(()=>w.right(10));
});

const spanSet:[WindowStr,number,number|undefined,string][]=[
	[WindowStr.new('Hello'),0,,'Hello'],
	[WindowStr.new('Hello'),1,,'ello'],
	[WindowStr.new('Hello'),2,,'llo'],
	[WindowStr.new('Hello'),3,,'lo'],
	[WindowStr.new('Hello'),4,,'o'],
	[WindowStr.new('Hello'),5,,''],
	[WindowStr.new('Hello'),0,0,''],
	[WindowStr.new('Hello'),0,1,'H'],
	[WindowStr.new('Hello'),0,2,'He'],
	[WindowStr.new('Hello'),0,3,'Hel'],
	[WindowStr.new('Hello'),0,4,'Hell'],
	[WindowStr.new('Hello'),0,5,'Hello'],
	[WindowStr.new('Hello'),1,0,''],
	[WindowStr.new('Hello'),1,1,'e'],
	[WindowStr.new('Hello'),1,2,'el'],
	[WindowStr.new('Hello'),1,3,'ell'],
	[WindowStr.new('Hello'),1,4,'ello'],
	[WindowStr.new('Hello'),2,3,'llo'],
	[WindowStr.new('Hello'),2,2,'ll'],
	[WindowStr.new('Hello'),2,1,'l'],
	[WindowStr.new('Hello'),2,0,''],
];
for(const [w,start,len,expect] of spanSet) {
	tsts(`${w.debug()}.span(${start}, ${len})`,()=>{
		const o=w.span(start,len);
		assert.is(w.peerOf(o),true,'Uses same storage');
		assert.is(o.toString(),expect,'Has expected content');
	})
}

const badSpanSet:[WindowStr,number,number][]=[
	[WindowStr.new('Hello'),10,0],//Start out of range
	[WindowStr.new('Hello'),-1,0],//Add your own length
	[WindowStr.new('Hello'),0,6],//length oversized
	[WindowStr.new('Hello'),0,-1],//Invalid length
	[WindowStr.new('Hello'),1,5],//Invalid length after start adjust
];
for(const [w,start,len] of badSpanSet) {
	tsts(`${w.debug()}.span(${start}, ${len}) throws`,()=>{
		assert.throws(()=>w.span(start,len));
	});
}

const splitSet:[WindowStr,string,number|undefined,string[]][]=[
	[WindowStr.new('The quick brown!'),' ',,['The','quick','brown!']],
	[WindowStr.new('The quick brown!'),' ',0,[]],
	[WindowStr.new('The quick brown!'),' ',1,['The quick brown!']],
	[WindowStr.new('The quick brown!'),' ',2,['The','quick brown!']],
	[WindowStr.new('The quick brown!'),'?',,['The quick brown!']],
	[WindowStr.new('The quick brown!'),'!',,['The quick brown','']],
	[WindowStr.new('The quick brown!'),'',,[]],//empty sep isn't supported
];
for(const [w,sep,limit,expect] of splitSet) {
	tsts(`${w.debug()}.split(${sep},${limit})`,()=>{
		const s=w.split(sep,limit);
		assert.is(s.length,expect.length,'Result size matches');
		for(let i=0;i<expect.length;i++) assert.is(s[i].toString(),expect[i]);
	})
}

tsts(`split results in source is different object`,()=>{
	const w=WindowStr.new('Hello there');
	tsts(`${w.debug()}.split(?)`,()=>{
		const [s]=w.split('?');//Should result in 1 piece
		assert.is(w.toString(),s.toString());
		assert.is(w===s,false,'Different objects');
	})
})

const startsWithSet:[WindowStr,string,boolean][]=[
	[WindowStr.new('Hello'),'o',false],
	[WindowStr.new('Hello'),'lo',false],
	[WindowStr.new('Hello'),'llo',false],
	[WindowStr.new('Hello'),'ello',false],
	[WindowStr.new('Hello'),'Hello',true],
	[WindowStr.new('Hello'),'Hell',true],
	[WindowStr.new('Hello'),'Hel',true],
	[WindowStr.new('Hello'),'He',true],
	[WindowStr.new('Hello'),'H',true],
	[WindowStr.new('Hello'),'',true],
	[WindowStr.new('[Hello]',1,5),'lo',false],
	[WindowStr.new('[Hello]',1,5),'o',false],
	[WindowStr.new('[Hello]',1,5),'He',true],
	[WindowStr.new('[Hello]',1,5),'H',true],
	//Can't escape window:
	[WindowStr.new('[Hello]',1,5),'o]',false],
	[WindowStr.new('[Hello]',1,5),'[H',false],
];
for(const [w,search,expect] of startsWithSet) {
	tsts(`${w.debug()}.startsWith(${search})`,()=>{
		assert.is(w.startsWith(search),expect);
	})
}

const testSet:[WindowStr,RegExp,boolean][]=[
	[WindowStr.new('Hello'),/l/g,true],
	[WindowStr.new('Hello'),/^l/g,false],
	[WindowStr.new('Hello'),/^Hel/g,true],
	[WindowStr.new(']Hello[',1,5),/^Hel/g,true],
];
for(const [w,re,expect] of testSet) {
	tsts(`${w.debug()}.test(${re})`,()=>{
		assert.equal(w.test(re),expect);
	})
}

tsts(`coerce(WindowStr) returns same content`,()=>{
	const w=WindowStr.new('Hello');
	const c=WindowStr.coerce(w);
	assert.is(w,c);
})

tsts(`coerce(string) returns window`,()=>{
	const s='finish';
	const c=WindowStr.coerce(s);
	assert.instance(c,WindowStr);
});

const trimStartSet:[WindowStr,string[]|undefined,number|undefined,string][]=[
	[WindowStr.new(' a '),,,'a '],
	[WindowStr.new('  a'),,,'a'],
	[WindowStr.new('a  '),,,'a  '],
	[WindowStr.new('\ta\tb\t'),,,'a\tb\t'],
	[WindowStr.new('abba'),['a'],,'bba'],
	[WindowStr.new('abba'),['a','b'],,''],
	[WindowStr.new('  a'),,1,' a'],
	[WindowStr.new('  a'),,2,'a'],
	[WindowStr.new('  a'),,3,'a'],
];
for(const [w,chars,limit,expect] of trimStartSet) {
	tsts(`${w.debug()}.trimStart(,${limit})`,()=>{
		const res=w.trimStart(chars,limit);
		assert.is(res,w,'Mutates state');
		assert.is(res.toString(),expect);
	})
}

const trimEndSet:[WindowStr,string[]|undefined,number|undefined,string][]=[
	[WindowStr.new(' a '),,,' a'],
	[WindowStr.new('  a'),,,'  a'],
	[WindowStr.new('a  '),,,'a'],
	[WindowStr.new('\ta\tb\t'),,,'\ta\tb'],
	[WindowStr.new('abba'),['a'],,'abb'],
	[WindowStr.new('abba'),['a','b'],,''],
	[WindowStr.new('a  '),,1,'a '],
	[WindowStr.new('a  '),,2,'a'],
	[WindowStr.new('a  '),,3,'a'],
];
for(const [w,chars,limit,expect] of trimEndSet) {
	tsts(`${w.debug()}.trimEnd(,${limit})`,()=>{
		const res=w.trimEnd(chars,limit);
		assert.is(res,w,'Mutates state');
		assert.is(res.toString(),expect);
	})
}

const shrinkSet:[WindowStr,number|undefined,number|undefined,string][]=[
	[WindowStr.new('hello'),,,'hello'],
	[WindowStr.new('hello'),1,,'ello'],
	[WindowStr.new('hello'),5,,''],
	[WindowStr.new('hello'),,1,'hell'],
	[WindowStr.new('hello'),,5,''],
	[WindowStr.new('hello'),1,1,'ell'],
];
for(const [w,startBy,lenBy,expect] of shrinkSet) {
	tsts(`${w.debug()}.shrink(${startBy}, ${lenBy})`,()=>{
		const res=w.shrink(startBy,lenBy);
		assert.is(res,w,'Mutates state');
		assert.is(res.toString(),expect);
	})
}

const badShrinkSet:[WindowStr,number|undefined,number|undefined][]=[
	[WindowStr.new('hello'),6,undefined],//Start out of range
	[WindowStr.new('hello'),,6],//Length out of range
	[WindowStr.new('hello'),3,3],//Combined start/length out of range
];
for(const [w,startBy,lenBy] of badShrinkSet) {
	tsts(`${w.debug()}.shrink(${startBy}, ${lenBy})  throws`,()=>{
		assert.throws(()=>w.shrink(startBy,lenBy));
	})
}

tsts(`shrink will only mutate if valid`,()=>{
	const w=WindowStr.new('hello');
	assert.is(w.toString(),'hello');
	try {
		w.shrink(3,3);//This should throw
	} catch {}
	assert.is(w.toString(),'hello','One of the two shrinks was not executed before exception');
});

const iteratorSet:[WindowStr,string[]][]=[
	[WindowStr.new('hello'),['h','e','l','l','o']],
	[WindowStr.new('£99'),['£','9','9']],
	[WindowStr.new('☃★♲'),['☃','★','♲']],
	[WindowStr.new('ABC'),['A','B','C']],
	[WindowStr.new('😍'),['😍']],
	[WindowStr.new('👉🏿'),['👉', '🏿']],
	[WindowStr.new('👨‍👦'),['👨', '‍', '👦']],
	[WindowStr.new('\ud83d\ude0d'),['😍']],//Yup that's a surrogate pair

];
for(const [w,expect] of iteratorSet) {
	tsts(`${w.debug()}.iterate`,()=>{
		const found=[...w];
		assert.is(found.length,expect.length);
		for(let i=0;i<found.length;i++) assert.is(found[i],expect[i],`[${i}]`);
	})
}


tsts.run();
