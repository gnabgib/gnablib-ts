import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { ParallelHashXof256 } from '../../../src/crypto';

const tsts = suite('ParallelHashXof256');

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
        data:hex.toBytes('000102030405060710111213141516172021222324252627'),
        blockSize:8,
        size:512/8,
        expect:'C10A052722614684144D28474850B410757E3CBA87651BA167A5CBDDFF7F466675FBF84BCAE7378AC444BE681D729499AFCA667FB879348BFDDA427863C82F1C'
    },
    {
        data:hex.toBytes('000102030405060710111213141516172021222324252627'),
        blockSize:8,
        size:512/8,
        customize:'Parallel Data',
        expect:'538E105F1A22F44ED2F5CC1674FBD40BE803D9C99BF5F8D90A2C8193F3FE6EA768E5C1A20987E2C9C65FEBED03887A51D35624ED12377594B5585541DC377EFC'
    },
    {
        data:hex.toBytes('000102030405060708090A0B101112131415161718191A1B202122232425262728292A2B303132333435363738393A3B404142434445464748494A4B505152535455565758595A5B'),
        blockSize:12,
        size:512/8,
        customize:'Parallel Data',
        expect:'6B3E790B330C889A204C2FBC728D809F19367328D852F4002DC829F73AFD6BCEFB7FE5B607B13A801C0BE5C1170BDB794E339458FDB0E62A6AF3D42558970249'
    },
];

let count=0;
for (const test of tests) {
    tsts('Test['+count+']:',()=>{
        const hash=new ParallelHashXof256(test.blockSize,test.size,test.customize);
        hash.write(test.data);
        const md=hash.sum();
        assert.is(hex.fromBytes(md),test.expect);
    });
    count++;
}

tsts.run();
