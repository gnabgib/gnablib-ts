import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { Salsa20_Poly1305 } from '../../../src/crypto';


const tsts = suite('Salsa20-Poly1305');

const tests:[string,string,string,string,string,string,string][]=[
    [
        'Calculated - this is an inferred cipher, ChaCha20/XChaCha20 are preferred',
        '808182838485868788898A8B8C8D8E8F909192939495969798999A9B9C9D9E9F',
        '07000000'+'40414243',
        '50515253C0C1C2C3C4C5C6C7',
        '4C616469657320616E642047656E746C656D656E206F662074686520636C617373206F66202739393A204966204920636F756C64206F6666657220796F75206F6E6C79206F6E652074697020666F7220746865206675747572652C2073756E73637265656E20776F756C642062652069742E',
        '50932AFD2B27BC7CE7E4827E5C92F24BDF7FF47BBF8CB6F582C46CF08DEDF95FD42E6929D5BAD750CB8F4EE77F255552CF6975A468E34DC35F82187DB433E4F54C60148C4A5F5C948DFA370BB4F3F26ABA2E70FF75FDA889634B4C6D8F67688767B4080895984213AEA1D68E3F06E3067A59',
        '35DE2CD707CE1819294792D3FD44037D'
    ],
]
for(const [descr,key,nonce,aad,plain,enc,tag] of tests) {
    tsts(`enc(${descr})`,()=>{
        const kBytes=hex.toBytes(key);
        const nBytes=hex.toBytes(nonce);
        const aBytes=hex.toBytes(aad);

        const cp=new Salsa20_Poly1305(kBytes,nBytes);
        cp.writeAD(aBytes);
        
        const pBytes=hex.toBytes(plain);
        const eBytes=new Uint8Array(pBytes.length);

        cp.encryptInto(eBytes,pBytes);
        const foundTag=cp.finalize();
        assert.equal(hex.fromBytes(eBytes),enc,'enc');
        assert.equal(hex.fromBytes(foundTag),tag,'tag');
    });

    tsts(`dec(${descr})`,()=>{
        const kBytes=hex.toBytes(key);
        const nBytes=hex.toBytes(nonce);
        const aBytes=hex.toBytes(aad);

        const cp=new Salsa20_Poly1305(kBytes,nBytes);
        cp.writeAD(aBytes);
        
        const eBytes=hex.toBytes(enc);
        const pBytes=new Uint8Array(eBytes.length);

        cp.decryptInto(pBytes,eBytes);

        assert.equal(hex.fromBytes(pBytes),plain,'dec');
        assert.equal(cp.verify(hex.toBytes(tag)),true,'verified');
    });
}

tsts.run();