import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { U512 } from '../../../src/primitive/number';
import util from 'util';

const tsts = suite('U512');

// const toStrTest=[
// 	'0000000000000000000000000000000000000000000000000000000000000000',
// 	'0000000000000000000000000000000000000000000000000000000000000001',
// 	'1000000000000000000000000000000000000000000000000000000000000000',
// 	'FEDCBA9876543210000000000000000000000000000000000000000000000000',
//     '0000000000000000000000000000000000000000000000000FEDCBA987654321',
// 	'C4D5E6F78091A2B3000000000000000000000000000000000000000000000000',
//     '000000000000000000000000000000000000000000000000C4D5E6F78091A2B3',
// ];
// for(const expect of toStrTest) {
// 	tsts(`${expect}.toString`,()=>{
// 		const aBytes=hex.toBytes(expect);
// 		const a256=U512.fromBytesBE(aBytes);
// 		assert.is(a256.toString(),expect);
// 	});
// }

// const leBeTests:[number[],string,string][]= [
//     [
//         [1,2,3,4,5,6,7,8],
//         '0000000800000007000000060000000500000004000000030000000200000001',
//         '0100000002000000030000000400000005000000060000000700000008000000'
//     ],
//     [
//         [67305985,0x8070605,9,0,0,0,0,0],
//         '0000000000000000000000000000000000000000000000090807060504030201',
//         '0102030405060708090000000000000000000000000000000000000000000000'

//     ]
// ];
// for(const [u32s,be,le] of leBeTests) {
//     const fromUints=U256.fromUint32Octo(...u32s);
// 	tsts(`fromUint32Octo(${u32s})`,()=>{
//         assert.is(fromUints.toString(),be);
// 	});

//     const beBytes = hex.toBytes(be);
//     const fromBytesBE=U256.fromBytesBE(beBytes);
//     tsts(`fromBytesBE(${be})`,()=>{
//         assert.is(fromBytesBE.toString(),be,'fromBytesBE');
//         assert.is(hex.fromBytes(fromBytesBE.toBytesLE()),le,'toBytesLE');
// 	});

//     const leBytes=hex.toBytes(le);
//     const fromBytesLE=U256.fromBytesLE(leBytes);
//     tsts(`fromBytesLE(${le})`,()=>{
//         assert.is(fromBytesLE.toString(),be,'toString');
//         assert.is(hex.fromBytes(fromBytesLE.toBytesLE()),le,'toBytesLE');
// 	});
// }

// const fromIntTests:[number,string][]=[
//     [1,'0000000000000000000000000000000000000000000000000000000000000001'],
// ]
// for(const[int,expect] of fromIntTests) {
//     tsts(`fromIntUnsafe(${int})`,()=>{
//         const u=U256.fromIntUnsafe(int);
//         assert.is(u.toString(),expect);
// 	});
//     tsts(`fromInt(${int})`,()=>{
//         const u=U256.fromInt(int);
//         assert.is(u.toString(),expect);
// 	});
// }

// const fromArray:[Uint32Array,string][]=[
//     [
//         Uint32Array.of(1,2,3,4,5,6,7,8),
//         '0000000800000007000000060000000500000004000000030000000200000001',
//     ],
//     [
//         Uint32Array.of(1,2,3,4,5,6,7,8,9),//Oversized ignored
//         '0000000800000007000000060000000500000004000000030000000200000001',
//     ],
// ];
// for(const[arr,expect] of fromArray) {
//     tsts(`fromArray(${expect})`,()=>{
//         const u=U256.fromArray(arr);
//         assert.is(u.toString(),expect);
// 	});
//     tsts(`fromBuffer(${expect})`,()=>{
//         const u=U256.fromBuffer(arr.buffer);
//         assert.is(u.toString(),expect);
// 	});
// }

tsts(`mut32`,()=>{
    const u512=U512.max;
    const u32=U512.max.mut32();
    u32[0]=0;
    assert.equal(hex.fromBytes(u512.toBytesBE()),'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF');
    assert.equal(u32[0],0);
    assert.equal(u32[1],0xFFFFFFFF);
});

const bytesTests:[number[],string,string][]=[
    [
        [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16],
        '000000100000000F0000000E0000000D0000000C0000000B0000000A000000090000000800000007000000060000000500000004000000030000000200000001',
        '0100000002000000030000000400000005000000060000000700000008000000090000000A0000000B0000000C0000000D0000000E0000000F00000010000000'
    ]
];
for (const [u32s,expectBE,expectLE] of bytesTests) {
    const u=U512.fromUint32Hex(...u32s);
    tsts(`toBytesBE`,()=>{        
        assert.equal(hex.fromBytes(u.toBytesBE()),expectBE);
    })
    tsts(`toBytesLE`,()=>{
        assert.equal(hex.fromBytes(u.toBytesLE()),expectLE);
    })
}

tsts(`constants`,()=>{
	assert.equal(U512.max.toBytesBE(),Uint8Array.of(
        0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
        0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
        0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
        0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff
    ));
	assert.equal(U512.min.toBytesBE(),new Uint8Array(64));
	assert.equal(U512.zero.toBytesBE(),new Uint8Array(64));
});

tsts('[Symbol.toStringTag]', () => {
    const o=U512.fromUint32Hex(1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16);
	const str = Object.prototype.toString.call(o);
	assert.is(str.indexOf('U512') > 0, true);
});

tsts('util.inspect',()=>{
    const o=U512.fromUint32Hex(1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16);
    const u=util.inspect(o);
    assert.is(u.startsWith('U512('),true);
});

tsts.run();
