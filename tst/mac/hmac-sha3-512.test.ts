import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as hex from '../../src/encoding/Hex';
import * as utf8 from '../../src/encoding/Utf8';
import { Hmac } from '../../src/mac/Hmac';
import { Sha3_512 } from '../../src/hash/Sha3';

const tsts = suite('HMAC/RFC 2104 (Sha3-512)');

type hashHex={
    key:string|Uint8Array,
    data:string|Uint8Array,
    size?:number,
    expect:string
};

const sha3_512:hashHex[]=[
    //https://csrc.nist.gov/csrc/media/projects/cryptographic-standards-and-guidelines/documents/examples/hmac_sha3-512.pdf
    {
        key:'000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f',
        data:'Sample message for keylen<blocklen',
        expect:'4EFD629D6C71BF86162658F29943B1C308CE27CDFA6DB0D9C3CE81763F9CBCE5F7EBE9868031DB1A8F8EB7B6B95E5C5E3F657A8996C86A2F6527E307F0213196'
    },
    {
        key:'000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f4041424344454647',
        data:'Sample message for keylen=blocklen',
        expect:'544E257EA2A3E5EA19A590E6A24B724CE6327757723FE2751B75BF007D80F6B360744BF1B7A88EA585F9765B47911976D3191CF83C039F5FFAB0D29CC9D9B6DA'
    },
    {
        key:'000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f404142434445464748494a4b4c4d4e4f505152535455565758595a5b5c5d5e5f606162636465666768696a6b6c6d6e6f707172737475767778797a7b7c7d7e7f8081828384858687',
        data:'Sample message for keylen>blocklen',
        expect:'5F464F5E5B7848E3885E49B2C385F0694985D0E38966242DC4A5FE3FEA4B37D46B65CECED5DCF59438DD840BAB22269F0BA7FEBDB9FCF74602A35666B2A32915'
    },
    {
        key:'000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f',
        data:'Sample message for keylen<blocklen, with truncated tag',
        size:32,
        expect:'7BB06D859257B25CE73CA700DF34C5CBEF5C898BAC91029E0B27975D4E526A08'
    },
    //https://www.liavaag.org/English/SHA-Generator/HMAC/
    {
        key:'6B6579',//key
        data:'The quick brown fox jumps over the lazy dog',
        expect:'237A35049C40B3EF5DDD960B3DC893D8284953B9A4756611B1B61BFFCF53EDD979F93547DB714B06EF0A692062C609B70208AB8D4A280CEEE40ED8100F293063'},
    {
        key:'6B6579',//key
        data:'gnabgib',
        expect:'D74A71C20A6C941D5FBF165E8DB13496D91F3CD3D2DDD9E860642CCCAACC12E3B7C6FA8BBD8093437691220EDE8BF33A24926336CA6B8204EF2C365A36E7E107'
    },
];
for (const test of sha3_512) {
    //Note we reuse the hash object
    const hash=new Sha3_512();
    tsts('hmac-sha3-512: '+test.data,()=>{
        const bKey=test.key instanceof Uint8Array ? test.key : hex.toBytes(test.key);
        const bMsg=test.data instanceof Uint8Array ? test.data : utf8.toBytes(test.data);
        //console.log(`${hex.fromBytes(bMsg)}`);
        const mac=new Hmac(hash,bKey);
        mac.write(bMsg);
        const found=mac.sum(test.size);
        assert.is(hex.fromBytes(found),test.expect);
    });
}

tsts.run();
