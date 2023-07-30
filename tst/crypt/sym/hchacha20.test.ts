import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/encoding/Hex';
import { hChaCha20 } from '../../../src/crypt/sym/ChaCha';


const tsts = suite('hChaCha20');

const hsalsaTests:[string,string,string][]=[
    //https://datatracker.ietf.org/doc/html/draft-irtf-cfrg-xchacha-03
    [
        '000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F',
        '000000090000004A0000000031415927',
        '82413B4227B27BFED30E42508A877D73A0F9E4D58A74A853C12EC41326D3ECDC'
    ],
];
for(const [key,input,output] of hsalsaTests) {
    tsts('hChaCha20',()=>{
        const o=new Uint8Array(32);
        hChaCha20(o,hex.toBytes(key),hex.toBytes(input));
        assert.equal(hex.fromBytes(o),output);
    })
}

tsts.run();