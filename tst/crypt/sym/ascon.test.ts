import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/encoding/Hex';
import { utf8 } from '../../../src/encoding/Utf8';
import { Ascon } from '../../../src/crypt/sym/Ascon';


const tsts = suite('Ascon');

interface KAT {
    descr?:string,
    k:string,
    n:string,
    ad:string,
    pt:string,
    ct:string,
    tag:string
}

const aead128Tests2:KAT[]=[
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
for(const {descr,k,n,pt,ad,ct,tag} of aead128Tests2) {
    tsts(`aead128-enc(${descr})`,()=>{
        const a=new Ascon(hex.toBytes(k),hex.toBytes(n),8,12,6);
        if (ad.length>0) a.writeAssocData(hex.toBytes(ad));
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
        const a=new Ascon(hex.toBytes(k),hex.toBytes(n),8,12,6);
        if (ad.length>0) a.writeAssocData(hex.toBytes(ad));
        if (ct.length>0) {
            const eBytes=hex.toBytes(ct);
            const pBytes=new Uint8Array(eBytes.length);
            a.decryptInto(pBytes,eBytes);
            assert.equal(hex.fromBytes(pBytes),pt,'dec');
        }
        assert.equal(a.verify(hex.toBytes(tag)),true,'verify');
    });
}

const aead128aTests:KAT[]=[
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
    tsts(`aead128a-enc(${descr})`,()=>{
        const a=new Ascon(hex.toBytes(k),hex.toBytes(n),16,12,8);
        if (ad.length>0) a.writeAssocData(hex.toBytes(ad));
        if (pt.length>0) {
            const pBytes=hex.toBytes(pt);
            const eBytes=new Uint8Array(pBytes.length);
            a.encryptInto(eBytes,pBytes);
            assert.equal(hex.fromBytes(eBytes),ct,'enc');
        }
        const tagFound=a.finalize();
        assert.equal(hex.fromBytes(tagFound),tag,'tag');
    });
    tsts(`aead128a-dec(${descr})`,()=>{
        const a=new Ascon(hex.toBytes(k),hex.toBytes(n),16,12,8);
        if (ad.length>0) a.writeAssocData(hex.toBytes(ad));
        if (ct.length>0) {
            const eBytes=hex.toBytes(ct);
            const pBytes=new Uint8Array(eBytes.length);
            a.decryptInto(pBytes,eBytes);
            assert.equal(hex.fromBytes(pBytes),pt,'dec');
        }
        assert.equal(a.verify(hex.toBytes(tag)),true,'verify');
    });
}

const aead80pqTests:KAT[]=[
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
    tsts(`aead80pq-enc(${descr})`,()=>{
        const a=new Ascon(hex.toBytes(k),hex.toBytes(n),8,12,6);
        if (ad.length>0) a.writeAssocData(hex.toBytes(ad));
        if (pt.length>0) {
            const pBytes=hex.toBytes(pt);
            const eBytes=new Uint8Array(pBytes.length);
            a.encryptInto(eBytes,pBytes);
            assert.equal(hex.fromBytes(eBytes),ct,'enc');
        }
        const tagFound=a.finalize();
        assert.equal(hex.fromBytes(tagFound),tag,'tag');
    });
    tsts(`aead80pq-dec(${descr})`,()=>{
        const a=new Ascon(hex.toBytes(k),hex.toBytes(n),8,12,6);
        if (ad.length>0) a.writeAssocData(hex.toBytes(ad));
        if (ct.length>0) {
            const eBytes=hex.toBytes(ct);
            const pBytes=new Uint8Array(eBytes.length);
            a.decryptInto(pBytes,eBytes);
            assert.equal(hex.fromBytes(pBytes),pt,'dec');
        }
        assert.equal(a.verify(hex.toBytes(tag)),true,'verify');
    });
}

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