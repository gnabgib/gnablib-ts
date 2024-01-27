import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { BitReader } from '../../src/primitive/BitReader';
import { hex } from '../../src/codec';

const tsts = suite('BitReader');

//16: 1,3,5,7, 1,1,7,7 3,3,3,7 3,3,5,5 (addition of primes)
//b0101 = 5, b1010 = A

const deser:[string,number[],number[]][] = [
    ['AAAA',[1,3,5,7],[1,2,21,42]],//1 010 10101 0101010
    ['AAAA',[1,1,7,7],[1,0,85,42]],//1 0 1010101 0101010
    ['AAAA',[3,3,3,7],[5,2,5,42]],//101 010 101 0101010
    ['AAAA',[3,3,5,5],[5,2,21,10]],//101 010 10101 01010

    ['5555',[1,3,5,7],[0,5,10,85]],//0 101 01010 1010101
    ['5555',[1,1,7,7],[0,1,42,85]],//0 1 0101010 1010101
    ['5555',[3,3,3,7],[2,5,2,85]],//010 101 010 1010101
    ['5555',[3,3,5,5],[2,5,10,21]],//010 101 01010 10101
];

for(const [ser,bits,vals] of deser) {
    tsts(`deser(${ser},${bits})`,()=>{
        var bytes=hex.toBytes(ser);
        const br=new BitReader(bytes);
        for(let i=0;i<bits.length;i++) {
            const v=br.readNumber(bits[i]);
            assert.is(v,vals[i],`bit ${i}`);
        }
    });
}


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

tsts.run();
