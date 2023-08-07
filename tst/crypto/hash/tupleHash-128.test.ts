import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { TupleHash128 } from '../../../src/crypto';

const tsts = suite('TupleHash128');

type hashHex={
    data:Uint8Array[],
    size?:number,
    customize?:string,
    expect:string
};

const tests:hashHex[]=[
    //https://csrc.nist.gov/csrc/media/projects/cryptographic-standards-and-guidelines/documents/examples/tuplehash_samples.pdf
    {
        data:[hex.toBytes('000102'),hex.toBytes('101112131415')],
        expect:'C5D8786C1AFB9B82111AB34B65B2C0048FA64E6D48E263264CE1707D3FFC8ED1'
    },
    {
        data:[hex.toBytes('000102'),hex.toBytes('101112131415')],
        customize:'My Tuple App',
        expect:'75CDB20FF4DB1154E841D758E24160C54BAE86EB8C13E7F5F40EB35588E96DFB'
    },
    {
        data:[hex.toBytes('000102'),hex.toBytes('101112131415'),hex.toBytes('202122232425262728')],
        customize:'My Tuple App',
        expect:'E60F202C89A2631EDA8D4C588CA5FD07F39E5151998DECCF973ADB3804BB6E84'
    },
];

let count=0;
for (const test of tests) {
    tsts(`TupleHash[${count++}]`,()=>{
        const hash=new TupleHash128(test.size??32,test.customize);
        for(let i=0;i<test.data.length;i++) hash.write(test.data[i]);
        const md=hash.sum();
        assert.is(hex.fromBytes(md),test.expect);
    });
}

tsts.run();
