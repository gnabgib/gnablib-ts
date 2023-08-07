import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/encoding/Hex';
import { XChaCha20_Poly1305 } from '../../../src/mac/Poly1305';


const tsts = suite('XChaCha20-Poly1305');

const tests:[string,string,string,string,string,string,string][]=[
    [
        'Calculated',
        '808182838485868788898A8B8C8D8E8F909192939495969798999A9B9C9D9E9F',
        '07000000'+'4041424344454647'+'000000000000000000000000',
        '50515253C0C1C2C3C4C5C6C7',
        '4C616469657320616E642047656E746C656D656E206F662074686520636C617373206F66202739393A204966204920636F756C64206F6666657220796F75206F6E6C79206F6E652074697020666F7220746865206675747572652C2073756E73637265656E20776F756C642062652069742E',
        '7C71AA4CF608BA38C4CBC9FFE3A719C6E15A66A65E16EFEB667BDE69AB85B111DE4BB2CE4F52E107D1327D7A7E2C90B476321B60CB4E1B2A08EC956A4CDEDBCB6F4FED35DDB69D765A9B55C010494AF8487DB280B813783A2C81D5BBAF014D52D55B0FE88DD4A11951B0CB81D88605F4F905',
        'AF7302B6D5949433450C5F9F6824710A'
    ],
]
for(const [descr,key,nonce,aad,plain,enc,tag] of tests) {
    tsts(`enc(${descr})`,()=>{
        const kBytes=hex.toBytes(key);
        const nBytes=hex.toBytes(nonce);
        const aBytes=hex.toBytes(aad);

        const cp=new XChaCha20_Poly1305(kBytes,nBytes);
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

        const cp=new XChaCha20_Poly1305(kBytes,nBytes);
        cp.writeAD(aBytes);
        
        const eBytes=hex.toBytes(enc);
        const pBytes=new Uint8Array(eBytes.length);

        cp.decryptInto(pBytes,eBytes);

        assert.equal(hex.fromBytes(pBytes),plain,'dec');
        assert.equal(cp.verify(hex.toBytes(tag)),true,'verified');
    });
}

tsts.run();