import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/encoding/Hex';
import { XSalsa20_Poly1305 } from '../../../src/mac/Poly1305';


const tsts = suite('XSalsa20-Poly1305');

const tests:[string,string,string,string,string,string,string][]=[
    [
        'Calculated',
        '808182838485868788898A8B8C8D8E8F909192939495969798999A9B9C9D9E9F',
        '07000000'+'4041424344454647'+'000000000000000000000000',
        '50515253C0C1C2C3C4C5C6C7',
        '4C616469657320616E642047656E746C656D656E206F662074686520636C617373206F66202739393A204966204920636F756C64206F6666657220796F75206F6E6C79206F6E652074697020666F7220746865206675747572652C2073756E73637265656E20776F756C642062652069742E',
        '35BFE2B6981A98A5B72961747C6C4937809E74BBF55BDC7D657FDCB78F94674B1861F3F8A27D3919335CDA1710B363F63034DD2CF568083C9D04BF54BB45F1BA84C8B776A3853963B16A38F45A7BEADEC2A083192596C8761B3136E780DB947C3D2D7689C93633827B1FC9192BE3ADEE8F74',
        'A75A04CB0495517FC94010D1BE0992B5'
    ],
]
for(const [descr,key,nonce,aad,plain,enc,tag] of tests) {
    tsts(`enc(${descr})`,()=>{
        const kBytes=hex.toBytes(key);
        const nBytes=hex.toBytes(nonce);
        const aBytes=hex.toBytes(aad);

        const cp=new XSalsa20_Poly1305(kBytes,nBytes);
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

        const cp=new XSalsa20_Poly1305(kBytes,nBytes);
        cp.writeAD(aBytes);
        
        const eBytes=hex.toBytes(enc);
        const pBytes=new Uint8Array(eBytes.length);

        cp.decryptInto(pBytes,eBytes);

        assert.equal(hex.fromBytes(pBytes),plain,'dec');
        assert.equal(cp.verify(hex.toBytes(tag)),true,'verified');
    });
}

tsts.run();