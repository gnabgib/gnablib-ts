import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { U256 } from '../../../src/primitive/number';
import util from 'util';

const tsts = suite('U256');

const toStrTest=[
	'0000000000000000000000000000000000000000000000000000000000000000',
	'0000000000000000000000000000000000000000000000000000000000000001',
	'1000000000000000000000000000000000000000000000000000000000000000',
	'FEDCBA9876543210000000000000000000000000000000000000000000000000',
    '0000000000000000000000000000000000000000000000000FEDCBA987654321',
	'C4D5E6F78091A2B3000000000000000000000000000000000000000000000000',
    '000000000000000000000000000000000000000000000000C4D5E6F78091A2B3',
];
for(const expect of toStrTest) {
	tsts(`${expect}.toString`,()=>{
		const aBytes=hex.toBytes(expect);
		const a256=U256.fromBytesBE(aBytes);
		assert.is(a256.toString(),expect);
	});
}

const leBeTests:[number[],string,string][]= [
    [
        [1,2,3,4,5,6,7,8],
        '0000000800000007000000060000000500000004000000030000000200000001',
        '0100000002000000030000000400000005000000060000000700000008000000'
    ],
    [
        [67305985,0x8070605,9,0,0,0,0,0],
        '0000000000000000000000000000000000000000000000090807060504030201',
        '0102030405060708090000000000000000000000000000000000000000000000'

    ]
];
for(const [u32s,be,le] of leBeTests) {
    const fromUints=U256.fromUint32Octo(...u32s);
	tsts(`fromUint32Octo(${u32s})`,()=>{
        assert.is(fromUints.toString(),be);
	});

    const beBytes = hex.toBytes(be);
    const fromBytesBE=U256.fromBytesBE(beBytes);
    tsts(`fromBytesBE(${be})`,()=>{
        assert.is(fromBytesBE.toString(),be,'fromBytesBE');
        assert.is(hex.fromBytes(fromBytesBE.toBytesLE()),le,'toBytesLE');
	});

    const leBytes=hex.toBytes(le);
    const fromBytesLE=U256.fromBytesLE(leBytes);
    tsts(`fromBytesLE(${le})`,()=>{
        assert.is(fromBytesLE.toString(),be,'toString');
        assert.is(hex.fromBytes(fromBytesLE.toBytesLE()),le,'toBytesLE');
	});
}

const fromIntTests:[number,string][]=[
    [1,'0000000000000000000000000000000000000000000000000000000000000001'],
]
for(const[int,expect] of fromIntTests) {
    tsts(`fromInt(${int})`,()=>{
        const u=U256.fromInt(int);
        assert.is(u.toString(),expect);
	});
}

const fromArray:[Uint32Array,string][]=[
    [
        Uint32Array.of(1,2,3,4,5,6,7,8),
        '0000000800000007000000060000000500000004000000030000000200000001',
    ],
    [
        Uint32Array.of(1,2,3,4,5,6,7,8,9),//Oversized ignored
        '0000000800000007000000060000000500000004000000030000000200000001',
    ],
];
for(const[arr,expect] of fromArray) {
    tsts(`fromArray(${expect})`,()=>{
        const u=U256.fromArray(arr);
        assert.is(u.toString(),expect);
	});
    tsts(`fromBuffer(${expect})`,()=>{
        const u=U256.fromBuffer(arr.buffer);
        assert.is(u.toString(),expect);
	});
}

tsts(`constants`,()=>{
	assert.equal(U256.max.toBytesBE(),Uint8Array.of(0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff));
	assert.equal(U256.min.toBytesBE(),Uint8Array.of(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0));
	assert.equal(U256.zero.toBytesBE(),Uint8Array.of(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0));
});

tsts('[Symbol.toStringTag]', () => {
    const o=U256.fromInt(1);
	const str = Object.prototype.toString.call(o);
	assert.is(str.indexOf('U256') > 0, true);
});

tsts('util.inspect',()=>{
    const o=U256.fromInt(1);
    const u=util.inspect(o);
    assert.is(u.startsWith('U256('),true);
});

tsts.run();
