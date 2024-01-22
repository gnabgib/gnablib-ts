import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { TupleHashXof128 } from '../../../src/crypto/xof';

const tsts = suite('TupleHashXof128');

type hashHex={
    data:Uint8Array[],
    size:number,
    customize?:string,
    expect:string
};

const tests:hashHex[]=[
    //https://csrc.nist.gov/csrc/media/projects/cryptographic-standards-and-guidelines/documents/examples/tuplehashxof_samples.pdf
    {
        data:[hex.toBytes('000102'),hex.toBytes('101112131415')],
        size:256/8,
        expect:'2F103CD7C32320353495C68DE1A8129245C6325F6F2A3D608D92179C96E68488'
    },
    {
        data:[hex.toBytes('000102'),hex.toBytes('101112131415')],
        size:256/8,
        customize:'My Tuple App',
        expect:'3FC8AD69453128292859A18B6C67D7AD85F01B32815E22CE839C49EC374E9B9A'
    },
    {
        data:[hex.toBytes('000102'),hex.toBytes('101112131415'),hex.toBytes('202122232425262728')],
        size:256/8,
        customize:'My Tuple App',
        expect:'900FE16CAD098D28E74D632ED852F99DAAB7F7DF4D99E775657885B4BF76D6F8'
    },
];

let count=0;
for (const test of tests) {
    tsts(`TupleHashXof[${count++}]`,()=>{
        const hash=new TupleHashXof128(test.size,test.customize);
        for(let i=0;i<test.data.length;i++) hash.write(test.data[i]);
        const md=hash.sum();
        assert.is(hex.fromBytes(md),test.expect);
    });
}

tsts.run();
