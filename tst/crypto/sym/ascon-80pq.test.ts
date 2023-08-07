import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { Ascon80pq } from '../../../src/crypto';
import { IKat } from './IKat';


const tsts = suite('Ascon-80pq');

const aead80pqTests:IKat[]=[
    {
        descr:'LWC_AEAD_KAT_128a 1',
        k:'000102030405060708090A0B0C0D0E0F10111213',
        n:'000102030405060708090A0B0C0D0E0F',
        pt:'',
        ad:'',
        ct:'',
        tag:'ABB688EFA0B9D56B33277A2C97D2146B'
    },
    {
        descr:'LWC_AEAD_KAT_128a 2',
        k:'000102030405060708090A0B0C0D0E0F10111213',
        n:'000102030405060708090A0B0C0D0E0F',
        pt:'',
        ad:'00',
        ct:'',
        tag:'A259D760E87B0CA73002C3A01E69B567'
    },
    {
        descr:'LWC_AEAD_KAT_128 3',
        k:'000102030405060708090A0B0C0D0E0F10111213',
        n:'000102030405060708090A0B0C0D0E0F',
        pt:'',
        ad:'0001',
        ct:'',
        tag:'6814DFCCE2DD955E890D49663D499061'
    },
    {
        descr:'LWC_AEAD_KAT_128 17',
        k:'000102030405060708090A0B0C0D0E0F10111213',
        n:'000102030405060708090A0B0C0D0E0F',
        pt:'',
        ad:'000102030405060708090A0B0C0D0E0F',
        ct:'',
        tag:'B59E1CFBDB3EF7C32BCD3B8818074A90'
    },
    {
        descr:'LWC_AEAD_KAT_128 18',
        k:'000102030405060708090A0B0C0D0E0F10111213',
        n:'000102030405060708090A0B0C0D0E0F',
        pt:'',
        ad:'000102030405060708090A0B0C0D0E0F10',
        ct:'',
        tag:'56726CE502528807D7F85C2E1CBE386B'
    },
    {
        descr:'LWC_AEAD_KAT_128 34',
        k:'000102030405060708090A0B0C0D0E0F10111213',
        n:'000102030405060708090A0B0C0D0E0F',
        pt:'00',
        ad:'',
        ct:'28',
        tag:'AA80FFF4CA3AF32F60EBCAF63A4CCAB7'
    },
    {
        descr:'LWC_AEAD_KAT_128 35',
        k:'000102030405060708090A0B0C0D0E0F10111213',
        n:'000102030405060708090A0B0C0D0E0F',
        pt:'00',
        ad:'00',
        ct:'A9',
        tag:'23553474FF995842ECCDC66E0BCA3D45'
    },
    {
        descr:'LWC_AEAD_KAT_128 67',
        k:'000102030405060708090A0B0C0D0E0F10111213',
        n:'000102030405060708090A0B0C0D0E0F',
        pt:'0001',
        ad:'',
        ct:'2846',
        tag:'798D04B1E591CBCDF30DBF58D268A69A'
    },
    {
        descr:'LWC_AEAD_KAT_128 68',
        k:'000102030405060708090A0B0C0D0E0F10111213',
        n:'000102030405060708090A0B0C0D0E0F',
        pt:'0001',
        ad:'00',
        ct:'A96A',
        tag:'60CB8D9F9BE0D28DBC0AF213535780BC'
    },
    {
        descr:'LWC_AEAD_KAT_128 174',
        k:'000102030405060708090A0B0C0D0E0F10111213',
        n:'000102030405060708090A0B0C0D0E0F',
        pt:'0001020304',
        ad:'0001020304050607',
        ct:'E16C12DD1D',
        tag:'671F098896657C2DC5B53E951DF2C1BF'
    },
    {
        descr:'LWC_AEAD_KAT_128 600',
        k:'000102030405060708090A0B0C0D0E0F10111213',
        n:'000102030405060708090A0B0C0D0E0F',
        pt:'000102030405060708090A0B0C0D0E0F1011',
        ad:'0001020304',
        ct:'1973543D218C55AD9B4282D7AD62CBE1149C',
        tag:'6661EE398FAC1B19857D57CD04D4D0F5'
    },
    {
        descr:'LWC_AEAD_KAT_128 1000',
        k:'000102030405060708090A0B0C0D0E0F10111213',
        n:'000102030405060708090A0B0C0D0E0F',
        pt:'000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D',
        ad:'000102030405060708',
        ct:'A4C1955E7ADB209B366654617C0CF56C8B9E3611BCA539E2DF70F1AAADCF',
        tag:'75CAF5F2159793BA330858AA97986F01'
    },
];
for(const {descr,k,n,pt,ad,ct,tag} of aead80pqTests) {
    tsts(`enc(${descr})`,()=>{
        const a=new Ascon80pq(hex.toBytes(k),hex.toBytes(n));
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
        const a=new Ascon80pq(hex.toBytes(k),hex.toBytes(n));
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