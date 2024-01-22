import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { Ascon128 } from '../../../src/crypto/sym';
import { IKat } from './IKat';


const tsts = suite('Ascon-128');


const aead128Tests:IKat[]=[
    {
        descr:'LWC_AEAD_KAT_128 1',
        k:'000102030405060708090A0B0C0D0E0F',
        n:'000102030405060708090A0B0C0D0E0F',
        pt:'',
        ad:'',
        ct:'',
        tag:'E355159F292911F794CB1432A0103A8A'
    },
    {
        descr:'LWC_AEAD_KAT_128 2',
        k:'000102030405060708090A0B0C0D0E0F',
        n:'000102030405060708090A0B0C0D0E0F',
        pt:'',
        ad:'00',
        ct:'',
        tag:'944DF887CD4901614C5DEDBC42FC0DA0'
    },
    {
        descr:'LWC_AEAD_KAT_128 3',
        k:'000102030405060708090A0B0C0D0E0F',
        n:'000102030405060708090A0B0C0D0E0F',
        pt:'',
        ad:'0001',
        ct:'',
        tag:'CE1936FBDD191058DEA8769B79319858'
    },
    {
        descr:'LWC_AEAD_KAT_128 17',
        k:'000102030405060708090A0B0C0D0E0F',
        n:'000102030405060708090A0B0C0D0E0F',
        pt:'',
        ad:'000102030405060708090A0B0C0D0E0F',
        ct:'',
        tag:'EF5763E75FE32F96D7863410FF0B4786'
    },
    {
        descr:'LWC_AEAD_KAT_128 18',
        k:'000102030405060708090A0B0C0D0E0F',
        n:'000102030405060708090A0B0C0D0E0F',
        pt:'',
        ad:'000102030405060708090A0B0C0D0E0F10',
        ct:'',
        tag:'79AC0FA2BF3859D6962D0C0AF45B1D3E'
    },
    {
        descr:'LWC_AEAD_KAT_128 34',
        k:'000102030405060708090A0B0C0D0E0F',
        n:'000102030405060708090A0B0C0D0E0F',
        pt:'00',
        ad:'',
        ct:'BC',
        tag:'18C3F4E39ECA7222490D967C79BFFC92'
    },
    {
        descr:'LWC_AEAD_KAT_128 35',
        k:'000102030405060708090A0B0C0D0E0F',
        n:'000102030405060708090A0B0C0D0E0F',
        pt:'00',
        ad:'00',
        ct:'BD',
        tag:'4102B707775C3C155AE497B43BF834E5'
    },
    {
        descr:'LWC_AEAD_KAT_128 67',
        k:'000102030405060708090A0B0C0D0E0F',
        n:'000102030405060708090A0B0C0D0E0F',
        pt:'0001',
        ad:'',
        ct:'BC82',
        tag:'D5BDE868F7494F57D81E06FACBF70CE1'
    },
    {
        descr:'LWC_AEAD_KAT_128 68',
        k:'000102030405060708090A0B0C0D0E0F',
        n:'000102030405060708090A0B0C0D0E0F',
        pt:'0001',
        ad:'00',
        ct:'BD46',
        tag:'5B2F5E3ABE7949BFD03CC4D6AC14CFBC'
    },
    {
        descr:'LWC_AEAD_KAT_128 174',
        k:'000102030405060708090A0B0C0D0E0F',
        n:'000102030405060708090A0B0C0D0E0F',
        pt:'0001020304',
        ad:'0001020304050607',
        ct:'69FFEE6F55',
        tag:'96EED35BA83999E2948195334F649B0B'
    },
    {
        descr:'LWC_AEAD_KAT_128 600',
        k:'000102030405060708090A0B0C0D0E0F',
        n:'000102030405060708090A0B0C0D0E0F',
        pt:'000102030405060708090A0B0C0D0E0F1011',
        ad:'0001020304',
        ct:'0E6A8B0CA517F53D3D72E1D8D734511C32CA',
        tag:'CAC740CBEE43DDBC674AACD895754FA6'
    },
    {
        descr:'LWC_AEAD_KAT_128 1000',
        k:'000102030405060708090A0B0C0D0E0F',
        n:'000102030405060708090A0B0C0D0E0F',
        pt:'000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D',
        ad:'000102030405060708',
        ct:'3225026599BCD4FCC460181575FA9D145BDD3D6B1B7332ED3D26467DCAC5',
        tag:'3FD6AADEC8D64472A6B869B8ACF37C46'
    },
];
for(const {descr,k,n,pt,ad,ct,tag} of aead128Tests) {
    tsts(`aead128-enc(${descr})`,()=>{
        const a=new Ascon128(hex.toBytes(k),hex.toBytes(n));
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
    tsts(`aead128-dec(${descr})`,()=>{
        const a=new Ascon128(hex.toBytes(k),hex.toBytes(n));
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

tsts(`AD after finalize throws`,()=>{
    const a=new Ascon128(hex.toBytes('000102030405060708090A0B0C0D0E0F'),hex.toBytes('000102030405060708090A0B0C0D0E0F'));
    a.finalize();
    assert.throws(()=>a.writeAD(new Uint8Array(0)));

})

tsts(`encrypt after finalize throws`,()=>{
    const a=new Ascon128(hex.toBytes('000102030405060708090A0B0C0D0E0F'),hex.toBytes('000102030405060708090A0B0C0D0E0F'));
    a.finalize();
    assert.throws(()=>a.encryptInto(new Uint8Array(0),new Uint8Array(0)));
});

tsts(`decrypt after finalize throws`,()=>{
    const a=new Ascon128(hex.toBytes('000102030405060708090A0B0C0D0E0F'),hex.toBytes('000102030405060708090A0B0C0D0E0F'));
    a.finalize();
    assert.throws(()=>a.decryptInto(new Uint8Array(0),new Uint8Array(0)));
});

tsts(`encryptSize`,()=>{
    const a=new Ascon128(hex.toBytes('000102030405060708090A0B0C0D0E0F'),hex.toBytes('000102030405060708090A0B0C0D0E0F'));
    assert.equal(13,a.encryptSize(13));
});


// const ror64Tests:[string,number,string][]=[
//     ['0102030405060708',0, '0102030405060708'],
//     ['0102030405060708',1, '0081018202830384'],
//     ['0102030405060708',2, '004080C1014181C2'],
//     ['0102030405060708',3, '0020406080A0C0E1'],
//     ['0102030405060708',4, '8010203040506070'],
//     ['0102030405060708',5, '4008101820283038'],
//     ['0102030405060708',6, '2004080C1014181C'],
//     ['0102030405060708',7, '10020406080A0C0E'],
//     ['0102030405060708',8, '0801020304050607'],
//     ['0102030405060708',9, '8400810182028303'],
//     ['0102030405060708',10,'C2004080C1014181'],

//     ['0102030405060708',32,'0506070801020304'],
//     ['0102030405060708',63,'020406080A0C0E10'],
//     ['0102030405060708',64,'0102030405060708'],
// ];
// for (const [start,by,expect] of ror64Tests) {
//     //x0102030405060708 = x01020304 x05060708 = 16909060 84281096
//     tsts(`ror64(${start}, ${by})`,()=>{
//         const b=hex.toBytes(start);
//         ror64(b,0,by);
//         assert.equal(hex.fromBytes(b),expect);
//     });
// }

tsts.run();