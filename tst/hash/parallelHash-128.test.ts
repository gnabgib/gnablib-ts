import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as hex from '../../src/encoding/Hex';
import { ParallelHash128 } from '../../src/hash/ParallelHash';

const tsts = suite('ParallelHash128');

type hashHex={
    data:Uint8Array,
    blockSize:number,
    size?:number,
    customize?:string,
    expect:string
};

const tests:hashHex[]=[
    //https://csrc.nist.gov/csrc/media/projects/cryptographic-standards-and-guidelines/documents/examples/parallelhash_samples.pdf
    {
        data:hex.toBytes('000102030405060710111213141516172021222324252627'),
        blockSize:8,
        expect:'BA8DC1D1D979331D3F813603C67F72609AB5E44B94A0B8F9AF46514454A2B4F5'
    },
    {
        data:hex.toBytes('000102030405060710111213141516172021222324252627'),
        blockSize:8,
        customize:'Parallel Data',
        expect:'FC484DCB3F84DCEEDC353438151BEE58157D6EFED0445A81F165E495795B7206'
    },
    {
        data:hex.toBytes('000102030405060708090A0B101112131415161718191A1B202122232425262728292A2B303132333435363738393A3B404142434445464748494A4B505152535455565758595A5B'),
        blockSize:12,
        customize:'Parallel Data',
        expect:'F7FD5312896C6685C828AF7E2ADB97E393E7F8D54E3C2EA4B95E5ACA3796E8FC'
    },
];

let count=0;
for (const test of tests) {
    tsts('Test['+count+']:',()=>{
        const hash=new ParallelHash128(test.blockSize,test.size??32,test.customize);
        hash.write(test.data);
        const md=hash.sum();
        assert.is(hex.fromBytes(md),test.expect);
    });
    count++;
}

tsts.run();
