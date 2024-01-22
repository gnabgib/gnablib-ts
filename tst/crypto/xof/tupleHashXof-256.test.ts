import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { TupleHashXof256 } from '../../../src/crypto/xof';


const tsts = suite('TupleHashXof256');

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
        size:512/8,
        expect:'03DED4610ED6450A1E3F8BC44951D14FBC384AB0EFE57B000DF6B6DF5AAE7CD568E77377DAF13F37EC75CF5FC598B6841D51DD207C991CD45D210BA60AC52EB9'
    },
    {
        data:[hex.toBytes('000102'),hex.toBytes('101112131415')],
        size:512/8,
        customize:'My Tuple App',
        expect:'6483CB3C9952EB20E830AF4785851FC597EE3BF93BB7602C0EF6A65D741AECA7E63C3B128981AA05C6D27438C79D2754BB1B7191F125D6620FCA12CE658B2442'
    },
    {
        data:[hex.toBytes('000102'),hex.toBytes('101112131415'),hex.toBytes('202122232425262728')],
        size:512/8,
        customize:'My Tuple App',
        expect:'0C59B11464F2336C34663ED51B2B950BEC743610856F36C28D1D088D8A2446284DD09830A6A178DC752376199FAE935D86CFDEE5913D4922DFD369B66A53C897'
    },
];

let count=0;
for (const test of tests) {
    tsts(`TupleHashXof[${count++}]`,()=>{
        const hash=new TupleHashXof256(test.size,test.customize);
        for(let i=0;i<test.data.length;i++) hash.write(test.data[i]);
        const md=hash.sum();
        assert.is(hex.fromBytes(md),test.expect);
    });
}

tsts.run();
