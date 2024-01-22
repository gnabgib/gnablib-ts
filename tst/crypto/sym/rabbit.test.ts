import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { Rabbit } from '../../../src/crypto/sym';


const tsts = suite('Rabbit/RFC 4503');

/**
 * Now Rabbit is old, but the docs are not clear on the endian of S0/S1/S2.
 * According to RFC-3447, we have a way to convert an octet-string into an integer.. 
 * but we're not looking to do that - we just want to know which way to match it to
 * the message stream.  Unfortunately (possibly due to age) there isn't a usable
 * reference.  For now we invert state so the encoded form matches the RFC listing
 */
const tests:{descr:string,key:string,iv?:string,plain:string,enc:string}[]=[
    {
        descr:"RC4503 A.1 #1",
        key:'00000000000000000000000000000000',
        plain:'000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
        enc:'B15754F036A5D6ECF56B45261C4AF70288E8D815C59C0C397B696C4789C68AA7F416A1C3700CD451DA68D1881673D696',
        //enc:'02F74A1C26456BF5ECD6A536F05457B1A78AC689476C697B390C9CC515D8E88896D6731688D168DA51D40C70C3A116F4' 
    },
    {
        descr:"RC4503 A.1 #2",
        key:'912813292E3D36FE3BFC62F1DC51C3AC',
        plain:'000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
        enc:'3D2DF3C83EF627A1E97FC38487E2519CF576CD61F4405B8896BF53AA8554FC19E5547473FBDB43508AE53B20204D4C5E'
        //enc:'9C51E28784C37FE9A127F63EC8F32D3D19FC5485AA53BF96885B40F461CD76F55E4C4D20203BE58A5043DBFB737454E5'
        //There seems to be a mistake in the RFC key=912813292EED36FE3BFC62F1DC51C3AC, but first round
        // suggests it should have been the following (key->state/count is purely a byte layout, so E cannot become 3)
    },
    {
        descr:"RC4503 A.1 #3",
        key:'8395741587E0C733E9E9AB01C09B0043',
        plain:'000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
        enc:'0CB10DCDA041CDAC32EB5CFD02D0609B95FC9FCA0F17015A7B7092114CFF3EAD9649E5DE8BFC7F3F924147AD3A947428'
        //enc:'9B60D002FD5CEB32ACCD41A0CD0DB10CAD3EFF4C1192707B5A01170FCA9FFC952874943AAD4741923F7FFC8BDEE54996'
    },
    {
        descr:"RC4503 A.2 #1",
        key:'00000000000000000000000000000000',
        iv:'0000000000000000',
        plain:'000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
        enc:'C6A7275EF85495D87CCD5D376705B7ED5F29A6AC04F5EFD47B8F293270DC4A8D2ADE822B29DE6C1EE52BDB8A47BF8F66'
        //enc:'EDB70567375DCD7CD89554F85E27A7C68D4ADC7032298F7BD4EFF504ACA6295F668FBF478ADB2BE51E6CDE292B82DE2A' 
    },
    {
        descr:"RC4503 A.2 #2",
        key:'00000000000000000000000000000000',
        iv:'C373F575C1267E59',
        plain:'000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
        enc:'1FCD4EB9580012E2E0DCCC9222017D6DA75F4E10D12125017B2499FFED936F2EEBC112C393E738392356BDD012029BA7'
        // enc: hex.fromBytes(hex.toBytes('1F CD 4E B9 58 00 12 E2 E0 DC CC 92 22 01 7D 6D').reverse())+
        //     hex.fromBytes(hex.toBytes('A7 5F 4E 10 D1 21 25 01 7B 24 99 FF ED 93 6F 2E').reverse())+
        //     hex.fromBytes(hex.toBytes('EB C1 12 C3 93 E7 38 39 23 56 BD D0 12 02 9B A7').reverse()),
    },
    {
        descr:"RC4503 A.2 #3",
        key:'00000000000000000000000000000000',
        iv:'A6EB561AD2F41727',
        plain:'000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
        enc:'445AD8C805858DBF70B6AF23A151104D96C8F27947F42C5BAEAE67C6ACC35B039FCBFC895FA71C17313DF034F01551CB'
        // enc: hex.fromBytes(hex.toBytes('44 5A D8 C8 05 85 8D BF 70 B6 AF 23 A1 51 10 4D').reverse())+
        //     hex.fromBytes(hex.toBytes('96 C8 F2 79 47 F4 2C 5B AE AE 67 C6 AC C3 5B 03').reverse())+
        //     hex.fromBytes(hex.toBytes('9F CB FC 89 5F A7 1C 17 31 3D F0 34 F0 15 51 CB').reverse()),
    },
    //B.1 dupe of A.1#2 (except with key-typo)
    {
        descr:"RC4503 B.2",
        key:'912813292E3D36FE3BFC62F1DC51C3AC',//Note the key typo again (vs 912813292EED36FE3BFC62F1DC51C3AC)
        iv:'C373F575C1267E59',
        plain:'000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
        //Enc isn't actually specified in RFC
        enc: 'BB5CF163D7F93E8DE95CEC5BD7231ABC7C9464F63F3F9EA0AAAA617C9ED87A476C7F5344F89F6181F6C5416F22683D6A',
    },
    {
        descr:'Sub block test (calculated)',
        key:'912813292E3D36FE3BFC62F1DC51C3AC',
        iv:'C373F575C1267E59',
        plain:'0000',
        enc:'BB5C'
    }
];
for(const {descr,key, iv, plain, enc} of tests) {
    tsts(`enc(${descr})`,()=>{
        const kBytes=hex.toBytes(key);
        const iBytes=iv===undefined?undefined:hex.toBytes(iv);
        const c=new Rabbit(kBytes,iBytes);
        const pBytes=hex.toBytes(plain);
        const eBytes=new Uint8Array(pBytes.length);
        c.encryptInto(eBytes,pBytes);
        assert.equal(hex.fromBytes(eBytes),enc);
        //c.blab();
    });
    tsts(`dec(${descr})`,()=>{
        const kBytes=hex.toBytes(key);
        const iBytes=iv===undefined?undefined:hex.toBytes(iv);
        const c=new Rabbit(kBytes,iBytes);
        const eBytes=hex.toBytes(enc);
        const pBytes=new Uint8Array(eBytes.length);
        c.decryptInto(pBytes,eBytes);
        assert.equal(hex.fromBytes(pBytes),plain);
    });
}

tsts('encrypts to same size as plain',()=>{
    const c=new Rabbit(hex.toBytes('912813292E3D36FE3BFC62F1DC51C3AC'));
    const plainLen=5;
    assert.equal(c.encryptSize(plainLen),plainLen);
})

tsts.run();