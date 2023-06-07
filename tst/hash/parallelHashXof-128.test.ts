import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Hex } from '../../src/encoding/Hex';
import { ParallelHashXof128 } from '../../src/hash/ParallelHash';

const tsts = suite('ParallelHashXof128');

type hashHex={
    data:Uint8Array,
    blockSize:number,
    size:number,
    customize?:string,
    expect:string
};

const tests:hashHex[]=[
    //https://csrc.nist.gov/CSRC/media/Projects/Cryptographic-Standards-and-Guidelines/documents/examples/ParallelHashXOF_samples.pdf
    {
        data:Hex.toBytes('000102030405060710111213141516172021222324252627'),
        blockSize:8,
        size:256/8,
        expect:'FE47D661E49FFE5B7D999922C062356750CAF552985B8E8CE6667F2727C3C8D3'
    },
    {
        data:Hex.toBytes('000102030405060710111213141516172021222324252627'),
        blockSize:8,
        size:256/8,
        customize:'Parallel Data',
        expect:'EA2A793140820F7A128B8EB70A9439F93257C6E6E79B4A540D291D6DAE7098D7'
    },
    {
        data:Hex.toBytes('000102030405060708090A0B101112131415161718191A1B202122232425262728292A2B303132333435363738393A3B404142434445464748494A4B505152535455565758595A5B'),
        blockSize:12,
        size:256/8,
        customize:'Parallel Data',
        expect:'0127AD9772AB904691987FCC4A24888F341FA0DB2145E872D4EFD255376602F0'
    },
];

let count=0;
for (const test of tests) {
    tsts('Test['+count+']:',()=>{
        const hash=new ParallelHashXof128(test.blockSize,test.size,test.customize);
        hash.write(test.data);
        const md=hash.sum();
        assert.is(Hex.fromBytes(md),test.expect);
    });
    count++;
}

tsts.run();
