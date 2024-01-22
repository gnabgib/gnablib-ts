import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { TupleHash256 } from '../../../src/crypto/hash';

const tsts = suite('TupleHash256');

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
        expect:'CFB7058CACA5E668F81A12A20A2195CE97A925F1DBA3E7449A56F82201EC607311AC2696B1AB5EA2352DF1423BDE7BD4BB78C9AED1A853C78672F9EB23BBE194'
    },
    {
        data:[hex.toBytes('000102'),hex.toBytes('101112131415')],
        customize:'My Tuple App',
        expect:'147C2191D5ED7EFD98DBD96D7AB5A11692576F5FE2A5065F3E33DE6BBA9F3AA1C4E9A068A289C61C95AAB30AEE1E410B0B607DE3620E24A4E3BF9852A1D4367E'
    },
    {
        data:[hex.toBytes('000102'),hex.toBytes('101112131415'),hex.toBytes('202122232425262728')],
        customize:'My Tuple App',
        expect:'45000BE63F9B6BFD89F54717670F69A9BC763591A4F05C50D68891A744BCC6E7D6D5B5E82C018DA999ED35B0BB49C9678E526ABD8E85C13ED254021DB9E790CE'
    },
];

let count=0;
for (const test of tests) {
    tsts(`TupleHash[${count++}]`,()=>{
        const hash=new TupleHash256(test.size??64,test.customize);
        for(let i=0;i<test.data.length;i++) hash.write(test.data[i]);
        const md=hash.sum();
        assert.is(hex.fromBytes(md),test.expect);
    });
}

tsts.run();
