import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { BitReader } from '../../src/primitive/BitReader';
import { hex } from '../../src/codec';
import util from 'util';

const tsts = suite('BitReader');

//16: 1,3,5,7, 1,1,7,7 3,3,3,7 3,3,5,5 (addition of primes)
//b0101 = 5, b1010 = A

const read_tests:[Uint8Array,number[],number[]][] = [
    [Uint8Array.of(0xAA,0xAA),[1,3,5,7],[1,2,21,42]],//1 010 10101 0101010
    [Uint8Array.of(0xAA,0xAA),[1,1,7,7],[1,0,85,42]],//1 0 1010101 0101010
    [Uint8Array.of(0xAA,0xAA),[3,3,3,7],[5,2,5,42]],//101 010 101 0101010
    [Uint8Array.of(0xAA,0xAA),[3,3,5,5],[5,2,21,10]],//101 010 10101 01010

    [Uint8Array.of(0x55,0x55),[1,3,5,7],[0,5,10,85]],//0 101 01010 1010101
    [Uint8Array.of(0x55,0x55),[1,1,7,7],[0,1,42,85]],//0 1 0101010 1010101
    [Uint8Array.of(0x55,0x55),[3,3,3,7],[2,5,2,85]],//010 101 010 1010101
    [Uint8Array.of(0x55,0x55),[3,3,5,5],[2,5,10,21]],//010 101 01010 10101


    //00010010 00110100 01010110 01111000
    //b000100100=x24, b0110100010101100=x68AC
    [Uint8Array.of(0x12,0x34,0x56,0x78),[9,16],[0x24, 0b0110100010101100]],

    //10000111110001111010010101100000
    //10000111 11000111 10100101 01100000
    //1000011111 000111 101001 01011 00000 = x21f x7 x29 xB
    //Regression test: At one point a rem read failed to reset the bit pointer
    // which manifested as #3=41 being wrong
    [Uint8Array.of(0x87,0xC7,0xA5,0x60),[10,6,6,5],[543,7,41,11]],
];

for(const [bytes,bitReadSet,vals] of read_tests) {
    tsts(`BitReader(${bytes}).readNumberBE([${bitReadSet}])`,()=>{
        const br=BitReader.mount(bytes);
        for(let i=0;i<bitReadSet.length;i++) {
            const n=br.readNumberBE(bitReadSet[i]);            
            assert.is(n,vals[i],`read(${i}=${bitReadSet[i]})`);
        }
    });
}

const read_ff_startBit_tests:[number,number,number][]=[
    [0,0,0],
    //Exhaustive read some-all from byte
    [0,1,1],
    [0,2,3],
    [0,3,7],
    [0,4,0xf],
    [0,5,0x1f],
    [0,6,0x3f],
    [0,7,0x7f],
    [0,8,0xff],
    //Exhaustive read sub-rem from byte
    [1,0,0],
    [1,1,1],
    [1,2,3],
    [1,3,7],
    [1,4,0xf],
    [1,5,0x1f],
    [1,6,0x3f],
    [1,7,0x7f],
];
for(const [startBit,bitRead,expect] of read_ff_startBit_tests) {
    const bytes=Uint8Array.of(0xff);
    tsts(`BitReader(xff,${startBit}).readNumberBE(${bitRead})`,()=>{
        const br=BitReader.mount(bytes,startBit);
        assert.equal(br.readNumberBE(bitRead),expect);
    });
}
const read_aa_startBit_tests:[number,number,number][]=[
    [0,0,0],
    //Exhaustive read some-all from byte
    [0,1,1],
    [0,2,2],
    [0,3,5],
    [0,4,0xa],
    [0,5,0x15],
    [0,6,0x2a],
    [0,7,0x55],
    [0,8,0xaa],
    //Exhaustive read sub-rem from byte
    [1,0,0],
    [1,1,0],
    [1,2,1],
    [1,3,2],
    [1,4,5],
    [1,5,0xa],
    [1,6,0x15],
    [1,7,0x2a],
];
for(const [startBit,bitRead,expect] of read_aa_startBit_tests) {
    const bytes=Uint8Array.of(0xaa);
    tsts(`BitReader(xaa,${startBit}).readNumberBE(${bitRead})`,()=>{
        const br=BitReader.mount(bytes,startBit);
        assert.equal(br.readNumberBE(bitRead),expect);
    });
}

const read_throw_tests:[Uint8Array,number,boolean][]=[
    [new Uint8Array(0),0,false],
    [new Uint8Array(0),1,true],
    //Exhaustive:
    [new Uint8Array(1),0,false],
    [new Uint8Array(1),1,false],
    [new Uint8Array(1),2,false],
    [new Uint8Array(1),3,false],
    [new Uint8Array(1),4,false],
    [new Uint8Array(1),5,false],
    [new Uint8Array(1),6,false],
    [new Uint8Array(1),7,false],
    [new Uint8Array(1),8,false],
    [new Uint8Array(1),9,true],
    //Make sure multi-byte reads ok
    [new Uint8Array(2),1,false],
    [new Uint8Array(2),9,false],
    [new Uint8Array(2),16,false],
    [new Uint8Array(2),17,true],
];
for(const [bytes,bitRead,throws] of read_throw_tests) {
    const br=BitReader.mount(bytes);
    tsts(`BitReader([${bytes.length}]).readNumberBE(${bitRead}) throws if content`,()=>{
        if (throws) assert.throws(()=>br.readNumberBE(bitRead));
        else br.readNumberBE(bitRead);
    });
}

tsts('BitReader with out of range startBit throws',()=>{
    const buff=new Uint8Array(1);
    assert.throws(()=>BitReader.mount(buff,-1));
    assert.throws(()=>BitReader.mount(buff,8));
});



// tsts('3x2,5x3,7x4,0x2,Fx2 in 2 bytes',()=>{
//     var bw=new BitWriter(2);
//     bw.writeNumber(3,2);
//     bw.writeNumber(5,3);
//     bw.writeNumber(7,4);
//     bw.writeNumber(0,2);
//     bw.writeNumber(0xf,2);
//     bw.writeNumber(0,3);//This is just here to make sure exact bits doesn't cause a size override

//     // 3x2 =b11, 5x3 = b101, 7x4 = b0111, 0x2 = b00, fx2 = b11 = 1110101110011000
//     assert.is(hex.fromBytes(bw.getBytes()),'EB98');
// });

tsts(`reset`,()=>{
    const bytes=Uint8Array.of(0xff,0xff);
    assert.equal(hex.fromBytes(bytes),'FFFF')
    
    const br=BitReader.mount(bytes);
    assert.equal(br.unreadBits,16);
    br.readNumberBE(8);
    assert.equal(br.unreadBits,8);
    assert.throws(()=>br.readNumberBE(16),"Reading 8+16 is too many");
    
    br.reset();
    assert.equal(br.unreadBits,16);
    br.readNumberBE(16);
    assert.equal(br.unreadBits,0);

    br.reset();
    assert.equal(br.unreadBits,16);
});

tsts('[Symbol.toStringTag]', () => {
    const bytes=new Uint8Array(0);
    const br=BitReader.mount(bytes);
    assert.is(Object.prototype.toString.call(br).indexOf("BitReader")>0,true,'toString is set');
});

tsts('util.inspect',()=>{
    const bytes=new Uint8Array(0);
    const br=BitReader.mount(bytes);
    const u=util.inspect(br);
    assert.is(u.startsWith('BitReader('),true);
});


tsts.run();
