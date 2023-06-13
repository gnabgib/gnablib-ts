import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as u8Ext from '../../src/primitive/UInt8ArrayExt';
import { Hex } from '../../src/encoding/Hex';

const tsts = suite('UInt8Array');

const toSizedBytesTest:[Uint8Array,number,number|undefined,Uint8Array][]=[
    [new Uint8Array(0),0,undefined,Uint8Array.of(0)],
    [Uint8Array.of(1,2),0,0,Uint8Array.of(0)],
    [Uint8Array.of(1,2),0,1,Uint8Array.of(1,1)],
    [Uint8Array.of(1,2),1,1,Uint8Array.of(1,2)],
    [Uint8Array.of(1,2),0,undefined,Uint8Array.of(2,1,2)],
];
let i=0;
for(const [input,start,end,expect] of toSizedBytesTest) {
	tsts(`toSizedBytes[${i++}]`,()=>{
		assert.equal(u8Ext.toSizedBytes(input,start,end),expect);
	});
    
}

const eqTest:string[]=[
	'00',
	'ffffffff',
	'ff00ff00ff00ff00',
	'aabbcc',
];
for (const aHex of eqTest) {
	const a=Hex.toBytes(aHex);
	const b=Hex.toBytes(aHex);
	tsts(`${aHex} ==.ct ${aHex}`,()=>{
		assert.equal(u8Ext.ctEq(a,b),true);
	});
}
const neqTest:[string,string][]=[
	['10','01'],
    ['1020','ff'],
    ['ff00ff00ff00ff00','ff00ff00ff00ff01'],
    ['fe00ff00ff00ff00','ff00ff00ff00ff00'],
];
for (const [aHex,bHex] of neqTest) {
	const a=Hex.toBytes(aHex);
	const b=Hex.toBytes(bHex);
    tsts(`!${aHex} ==.ct ${bHex}`,()=>{
		assert.equal(u8Ext.ctEq(a,b),false);
	});

}

const selTest:[string,string][]=[
	['01','10'],
    ['ff','10'],
    ['1020','beef'],
    ['ff00ff00ff00ff00','ff00ff00ff00ff01'],
    ['fe00ff00ff00ff00','ff00ff00ff00ff00'],
];
for(const [aHex,bHex] of selTest) {
    const a=Hex.toBytes(aHex);
	const b=Hex.toBytes(bHex);
	tsts(`select(${aHex},${bHex},true)`,()=>{
		assert.equal(u8Ext.ctSelect(a,b,true),a);
	});
	tsts(`select(${aHex},${bHex},false)`,()=>{
		assert.equal(u8Ext.ctSelect(a,b,false),b);
	});
}

tsts(`ctSelect(a,b) with diff lengths throws`,()=>{
    const a=new Uint8Array(0);
    const b=Uint8Array.of(1,2);
	assert.throws(()=>u8Ext.ctSelect(a,b,true));
	assert.throws(()=>u8Ext.ctSelect(b,a,true));
});

tsts.run();
