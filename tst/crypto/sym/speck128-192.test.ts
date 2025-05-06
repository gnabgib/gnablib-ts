import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { Speck128_192 } from '../../../src/crypto/sym/Speck128';

const tsts = suite('Speck128/192');

// prettier-ignore
const tests:[string,string,string][]=[
    //From https://nsacyber.github.io/simon-speck/implementations/ImplementationGuide1.1.pdf (2019)
    ['000102030405060708090A0B0C0D0E0F1011121314151617','656E7420746F20436869656620486172','86183CE05D18BCF9665513133ACFE41B'],
    //https://github.com/weidai11/cryptopp/blob/master/TestVectors/speck.txt
    //From Crypto++6 gen
    ['C289F537364FF63CB37FD75FEFB7C64D9D0997CD230B0BA2','0FF691D4E981FEFFC226BB85C2793B45','A757BDA6BAFD5356AE0693B89E4124F9'],
    ['0B4BE7BBEBB14BAAA14E2985A29E0C88A90331DAE9559584','90EE0DA5B755794A3DA6233D10B6658A','55308675A8BBE410270265DB6EE7EE66'],
    ['F672B91B29F2CCEFE7096B28D1DD1CA9AED1BA577B9D0AE5','15C8BA0448121768BFB45791D944D591','180B3772274677CBD71574EC3D8D1E7D'],
    ['3B41431A0930F98E17B4E62C93086518447FE733B1453590','23E21E14BAB904C8B03813EFDFADCCEB','77B3B9088D81182EC2D38E10E3CA2DA5'],
    ['F0C48216D1D57525E8C8912AC3B925EA70BB71167B67590D','0044DC0174DE0933AAFB1811566E5A3C','CB3876949B15CCCC74F3BC5CCE16681A'],
    ['C2DACB9E5F297E780A1D7A282F4C0E046D9CAACB98A1B4BA','5E6E7DE9C737AA6055C29B632C014E7F','8116F090EBE935C49AD2727648078C6C'],
    ['DDD0544A800FB15F0747A543298B0580BED0BB530644372B','57E65AF9AB7D4406DADC94BE134C7D2F','3F6E6C631EF7A6F88E52C511E969EC69'],
];
for (const [key, plain, enc] of tests) {
    const c = new Speck128_192(hex.toBytes(key));
    tsts(`Speck128/192(${key}).encrypt(${plain})`, () => {
        //Set found equal to plain-source-bytes
        const found = hex.toBytes(plain);
        //Encrypt a block (note the test vectors are all one block)
        c.encryptBlock(found);
        assert.is(hex.fromBytes(found), enc);
    });
    tsts(`Speck128/192(${key}).decrypt(${enc})`, () => {
        //Set found equal to encoded-source-bytes
        const found = hex.toBytes(enc);
        //Decrypt a block (note the test vectors are all one block)
        c.decryptBlock(found);
        assert.is(hex.fromBytes(found), plain);
    });
}

tsts.run();
