import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as hex from '../../src/encoding/Hex';
import { ParallelHash256 } from '../../src/hash/ParallelHash';
import * as utf8 from '../../src/encoding/Utf8';

const tsts = suite('ParallelHash256');

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
        expect:'BC1EF124DA34495E948EAD207DD9842235DA432D2BBC54B4C110E64C451105531B7F2A3E0CE055C02805E7C2DE1FB746AF97A1DD01F43B824E31B87612410429'
    },
    {
        data:hex.toBytes('000102030405060710111213141516172021222324252627'),
        blockSize:8,
        customize:'Parallel Data',
        expect:'CDF15289B54F6212B4BC270528B49526006DD9B54E2B6ADD1EF6900DDA3963BB33A72491F236969CA8AFAEA29C682D47A393C065B38E29FAE651A2091C833110'
    },
    {
        data:hex.toBytes('000102030405060708090A0B101112131415161718191A1B202122232425262728292A2B303132333435363738393A3B404142434445464748494A4B505152535455565758595A5B'),
        blockSize:12,
        customize:'Parallel Data',
        expect:'69D0FCB764EA055DD09334BC6021CB7E4B61348DFF375DA262671CDEC3EFFA8D1B4568A6CCE16B1CAD946DDDE27F6CE2B8DEE4CD1B24851EBF00EB90D43813E9'
    },
    //TODO: Find a suitable source for zero len, and size/blockSize!=integer tests (NIST is sorely lacking)
];

let count=0;
for (const test of tests) {
    tsts('Test['+count+']:',()=>{
        const hash=new ParallelHash256(test.blockSize,test.size??64,test.customize);
        hash.write(test.data);
        const md=hash.sum();
        assert.is(hex.fromBytes(md),test.expect);
    });
    count++;
}

tsts.run();
