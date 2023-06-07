import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Hex } from '../../src/encoding/Hex';
import { asBE, asE, asLE, isLE } from '../../src/endian/platform';

const tsts = suite('Platform');

const u16tests:[string,number,number,string][]=[
    ['0102',0,1,'0201'],
    ['01020304',0,1,'02010304'],
    ['01020304',0,2,'02010403'],
];
for(const [src,pos,count,invert] of u16tests) {
    tsts(`asLE.i16(${src},${pos},${count})`,()=>{
        const s=Hex.toBytes(src);
        asLE.i16(s,pos,count);
        if (isLE) {
            assert.is(Hex.fromBytes(s),src);
        } else {
            assert.is(Hex.fromBytes(s),invert);
        }
    });
}
for(const [src,pos,count,invert] of u16tests) {
    tsts(`asBE.i16(${src},${pos},${count})`,()=>{
        const s=Hex.toBytes(src);
        //const inv=hex.toBytes(invert);
        asBE.i16(s,pos,count);
        if (isLE) {
            assert.is(Hex.fromBytes(s),invert);            
        } else {
            assert.is(Hex.fromBytes(s),src);
        }
    });
}

const u32tests:[string,number,number,string][]=[
    ['01020304',0,1,'04030201'],
    ['0102030405060708',0,1,'0403020105060708'],
    ['0102030405060708',0,2,'0403020108070605'],
];
for(const [src,pos,count,invert] of u32tests) {
    tsts(`asLE.i32(${src},${pos},${count})`,()=>{
        const s=Hex.toBytes(src);
        asLE.i32(s,pos,count);
        if (isLE) {
            assert.is(Hex.fromBytes(s),src);
        } else {
            assert.is(Hex.fromBytes(s),invert);
        }
    });
}
for(const [src,pos,count,invert] of u32tests) {
    tsts(`asBE.i32(${src},${pos},${count})`,()=>{
        const s=Hex.toBytes(src);
        //const inv=hex.toBytes(invert);
        asBE.i32(s,pos,count);
        if (isLE) {
            assert.is(Hex.fromBytes(s),invert);            
        } else {
            assert.is(Hex.fromBytes(s),src);
        }
    });
}

const u64tests:[string,number,number,string][]=[
    ['0102030405060708',0,1,'0807060504030201'],
    ['000102030405060708090A0B0C0D0E0F',0,1,'070605040302010008090A0B0C0D0E0F'],
    ['000102030405060708090A0B0C0D0E0F',0,2,'07060504030201000F0E0D0C0B0A0908'],
];
for(const [src,pos,count,invert] of u64tests) {
    tsts(`asLE.i64(${src},${pos},${count})`,()=>{
        const s=Hex.toBytes(src);
        asLE.i64(s,pos,count);
        if (isLE) {
            assert.is(Hex.fromBytes(s),src);
        } else {
            assert.is(Hex.fromBytes(s),invert);
        }
    });
}
for(const [src,pos,count,invert] of u64tests) {
    tsts(`asBE.i64(${src},${pos},${count})`,()=>{
        const s=Hex.toBytes(src);
        //const inv=hex.toBytes(invert);
        asBE.i64(s,pos,count);
        if (isLE) {
            assert.is(Hex.fromBytes(s),invert);            
        } else {
            assert.is(Hex.fromBytes(s),src);
        }
    });
}


tsts('asB',()=>{
    const src='0102';
    const inv='0201';
    const s=Hex.toBytes(src);
    asE(!isLE).i16(s);
    assert.is(Hex.fromBytes(s),src);
    asE(isLE).i16(s);
    assert.is(Hex.fromBytes(s),inv);
});

// //We write in big endian
// const u32Pairs = [
// 	//big order - little order
// 	[[0x01, 0x23, 0x45, 0x67], 0x01234567],
// 	[[0x67, 0x45, 0x23, 0x01], 0x67452301],
// 	//big order - little order
// 	[[0x89, 0xab, 0xcd, 0xef], 0x89abcdef],
// 	[[0xef, 0xcd, 0xab, 0x89], 0xefcdab89],
// 	//big order - little order
// 	[[0xff, 0xee, 0xdd, 0xcc], 0xffeeddcc],
// 	[[0xcc, 0xdd, 0xee, 0xff], 0xccddeeff],
// 	//big order - little order
// 	[[0x00, 0x11, 0x22, 0x33], 0x00112233],
// 	[[0x33, 0x22, 0x11, 0x00], 0x33221100],
// ];

// for (const pair of u32Pairs) {
// 	const h = hex.fromBytes(new Uint8Array(pair[0] as number[]));

// 	tsts('Bytes as u32:' + h, () => {
// 		assert.is(
// 			bigEndian.u32FromBytes(new Uint8Array(pair[0] as number[])),
// 			pair[1]
// 		);
// 	});

// 	tsts('u32 as bytes:' + h, () => {
// 		const b = bigEndian.u32ToBytes(pair[1] as number);
// 		assert.is(hex.fromBytes(b), h);
// 	});
// }

// const u32IntoArrFromBytes = [
// 	[[1, 2, 3, 4, 5, 6, 7, 8], 1, 2, '000000000102030405060708'],
// 	[[1, 2, 3, 4, 5, 6, 7, 8], 1, 1, '000000000102030400000000'],
// 	[[1, 2, 3, 4, 5, 6, 7, 8], 0, 2, '010203040506070800000000'],
// ];

// for (const pair of u32IntoArrFromBytes) {
// 	const u32s = new Uint32Array(3);
// 	const u8 = new Uint8Array(pair[0]);
// 	tsts('u32IntoArrFromBytes:', () => {
// 		bigEndian.u32IntoArrFromBytes(u32s, pair[1], pair[2], u8, 0);
// 		assert.is(hex.fromU32s(u32s), pair[3]);
// 	});
// }

tsts.run();
