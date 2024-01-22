import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { Ascon128a } from '../../../src/crypto/sym';
import { IKat } from './IKat';


const tsts = suite('Ascon-128a');

const aead128aTests:IKat[]=[
    {
        descr:'LWC_AEAD_KAT_128a 1',
        k:'000102030405060708090A0B0C0D0E0F',
        n:'000102030405060708090A0B0C0D0E0F',
        pt:'',
        ad:'',
        ct:'',
        tag:'7A834E6F09210957067B10FD831F0078'
    },
    {
        descr:'LWC_AEAD_KAT_128a 2',
        k:'000102030405060708090A0B0C0D0E0F',
        n:'000102030405060708090A0B0C0D0E0F',
        pt:'',
        ad:'00',
        ct:'',
        tag:'AF3031B07B129EC84153373DDCABA528'
    },
    {
        descr:'LWC_AEAD_KAT_128 3',
        k:'000102030405060708090A0B0C0D0E0F',
        n:'000102030405060708090A0B0C0D0E0F',
        pt:'',
        ad:'0001',
        ct:'',
        tag:'B486742EB408CEFFF2F1290C6C8B1F1F'
    },
    {
        descr:'LWC_AEAD_KAT_128 17',
        k:'000102030405060708090A0B0C0D0E0F',
        n:'000102030405060708090A0B0C0D0E0F',
        pt:'',
        ad:'000102030405060708090A0B0C0D0E0F',
        ct:'',
        tag:'56C15EB024DE91CA0165362A49B31EBD'
    },
    {
        descr:'LWC_AEAD_KAT_128 18',
        k:'000102030405060708090A0B0C0D0E0F',
        n:'000102030405060708090A0B0C0D0E0F',
        pt:'',
        ad:'000102030405060708090A0B0C0D0E0F10',
        ct:'',
        tag:'917D530F34157158CF8CA49D01AF44F0'
    },
    {
        descr:'LWC_AEAD_KAT_128 34',
        k:'000102030405060708090A0B0C0D0E0F',
        n:'000102030405060708090A0B0C0D0E0F',
        pt:'00',
        ad:'',
        ct:'6E',
        tag:'652B55BFDC8CAD2EC43815B1666B1A3A'
        //g:'917D530F34157158CF8CA49D01AF44F0'
    },
    {
        descr:'LWC_AEAD_KAT_128 35',
        k:'000102030405060708090A0B0C0D0E0F',
        n:'000102030405060708090A0B0C0D0E0F',
        pt:'00',
        ad:'00',
        ct:'E9',
        tag:'C2813CC8C6DD2F245F3BB976DA566E9D'
        //g:'917D530F34157158CF8CA49D01AF44F0'
    },
    {
        descr:'LWC_AEAD_KAT_128 67',
        k:'000102030405060708090A0B0C0D0E0F',
        n:'000102030405060708090A0B0C0D0E0F',
        pt:'0001',
        ad:'',
        ct:'6E49',
        tag:'0868E32CB041A71CA5E41B615CE11C4E'
        //g:'917D530F34157158CF8CA49D01AF44F0'
    },
    {
        descr:'LWC_AEAD_KAT_128 68',
        k:'000102030405060708090A0B0C0D0E0F',
        n:'000102030405060708090A0B0C0D0E0F',
        pt:'0001',
        ad:'00',
        ct:'E92D',
        tag:'DC373C1745EB7E1F648BAEAE0F774787'
        //g:'917D530F34157158CF8CA49D01AF44F0'
    },
    {
        descr:'LWC_AEAD_KAT_128 174',
        k:'000102030405060708090A0B0C0D0E0F',
        n:'000102030405060708090A0B0C0D0E0F',
        pt:'0001020304',
        ad:'0001020304050607',
        ct:'34D3B7EDB8',
        tag:'06D07412A20BAB2616F901B3B6332ABD'
        //g:'917D530F34157158CF8CA49D01AF44F0'
    },
    {
        descr:'LWC_AEAD_KAT_128 600',
        k:'000102030405060708090A0B0C0D0E0F',
        n:'000102030405060708090A0B0C0D0E0F',
        pt:'000102030405060708090A0B0C0D0E0F1011',
        ad:'0001020304',
        ct:'0EE0ACB81FDA0513BB494134956A5B2A9E45',
        tag:'4931DAA651899867F52EE4D40D7F214E'
        //g:'917D530F34157158CF8CA49D01AF44F0'
    },
    {
        descr:'LWC_AEAD_KAT_128 1000',
        k:'000102030405060708090A0B0C0D0E0F',
        n:'000102030405060708090A0B0C0D0E0F',
        pt:'000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D',
        ad:'000102030405060708',
        ct:'DF4B3A7282D646F3C994BF84C39D6C704CE8B2796A1600A33B9EC9139A78',
        tag:'16AE17D3FF24CC13BF432300348CEC0D'
        //g:'917D530F34157158CF8CA49D01AF44F0'
    },
];
for(const {descr,k,n,pt,ad,ct,tag} of aead128aTests) {
    tsts(`enc(${descr})`,()=>{
        const a=new Ascon128a(hex.toBytes(k),hex.toBytes(n));
        if (ad.length>0) a.writeAD(hex.toBytes(ad));
        if (pt.length>0) {
            const pBytes=hex.toBytes(pt);
            const eBytes=new Uint8Array(pBytes.length);
            a.encryptInto(eBytes,pBytes);
            assert.equal(hex.fromBytes(eBytes),ct,'enc');
        }
        const tagFound=a.finalize();
        assert.equal(hex.fromBytes(tagFound),tag,'tag');
    });
    tsts(`dec(${descr})`,()=>{
        const a=new Ascon128a(hex.toBytes(k),hex.toBytes(n));
        if (ad.length>0) a.writeAD(hex.toBytes(ad));
        if (ct.length>0) {
            const eBytes=hex.toBytes(ct);
            const pBytes=new Uint8Array(eBytes.length);
            a.decryptInto(pBytes,eBytes);
            assert.equal(hex.fromBytes(pBytes),pt,'dec');
        }
        assert.equal(a.verify(hex.toBytes(tag)),true,'verify');
    });
}

tsts.run();