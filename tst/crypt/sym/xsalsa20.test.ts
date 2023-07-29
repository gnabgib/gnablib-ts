import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/encoding/Hex';
import { XSalsa20 } from '../../../src/crypt/sym/Salsa';
import { U64 } from '../../../src/primitive/U64';


const tsts = suite('XSalsa20');


const testEnc:[string,string,string,U64,string,string][]=[
    //https://github.com/google/adiantum/tree/master
    [
        'Adaintum 1',
        'A6A7251C1E72916D11C2CB214D3C252539121D8E234E652D651FA4C8CFF88030',
        '9e645a74e9e0a60d8243acd9177ab51a1beb8d5a2f5d700c',
        U64.fromInt(0),
        '093C5E5585579625337BD3AB619D615760D8C5B224A85B1D0EFE0EB8A7EE163ABB0376529FCC09BAB506C618E13CE777D82C3AE9D1A6F972D4160287CBFE60BF2130FC0A6FF6049D0A5C8A82F429231F008082E845D7E189D37F9ED2B464E6B919E6523A8C1210BD52A02A4C3FE406D3085F5068D1909EEECA6369ABC981A42E87FE665583F0AB85AE71F6F84F528E6B397AF86F6917D9754B7320DBDC2FEA81496F2732F532AC78C4E9C6CFB18F8E9BDF74622EB126141416776971A84F94D156BEAF67AECBF2AD412E76E66E8FAD7633F5B6D7F3D64B5C6C69CE29003C6024465AE3B89BE78E915D88B4B5621D',
        'B2AF688E7D8FC4B508C05CC39DD583D6714322C64D7F3E63147AEDE2D9534934B04FF6F337B031815CD094BDBC6D7A92077DCE709412286822EF0737EE47F6B7FFA22F9D53F11DD2B0A3BB9FC01D9A88F9D53C26E9365C2C3C063BC4840BFC812E4B80463E69D179530B25C158F543191CFF993106511AA036043BBC75866AB7E34AFC57E2CCE4934A5FAAE6EABE4F221770183DD060467827C27A354159A081275A291F69D946D6FE28ED0B9CE08206CF484925A51B9498DBDE178DDD3AE91A8581B91682D860F840782F6EEA49DBB9BD721501D2C67122DEA3B7283848C5F13E0C0DE876BD227A856E4DE593A3'
    ],
    [
        'Adaintum 2',
        '9E1DA239D155F52AD37F75C7368A536668B051952923AD44F57E75AB588E475A',
        'AF06F17859DFFA799891C4288F6635B5C5A45EEE9017FD72',
        U64.fromInt(0),
        'FEAC9D54FC8C115AE247D9A7E919DD76CFCBC72D32CAE4944860817CBDFB8C04E6B1DF76A16517CD33CCF1ACDA9206389E9E318F5966C093CFB3EC2D9EE2DE856437ED581F552F26AC2907609DF8C613B9E33D44BFC21FF79153E9EF81A9D66CC317857F752CC175FD8891FEFEBB7D041E6517C3162D197E2112837D3BC4104312AD35B75EA686E7C70D4EC04746B52FF09C421451459FB59F',
        '2C261A2F4E61A62E1B27689916BF03453FCBC97BB2AF6F329391EF063B5A219BF984D07D70F602D85F6DB61474E9D9F5A2DEECB4FCD90184D16F3B5B5E168EE03EA8C93F3933A22BC3D1A5AE8C2D8B02757C87C073409052A2A8A41E7F487E041F9A49A0997B540E18621CAD3A24F0A56D9B19227929057AB3BA950F6274B121F193E32E06E5388781A1CB57317C0BA6305E910961D01002F0'
    ],
    [
        'Adaintum 16',
        '5B14AB0FBED4C58952548A6CB1E0000CF4481421F41288EA0AA84ADD9F7DEB96',
        '54BF52B911231B952BA1A6AF8E45B1C5A29D97E2ABAD7C83',
        U64.fromInt(0),
        '37FB44A675978B560FF9A4A87011D6F3AD2D37A2C3815B45A3C0E6D1B1D8B1784CD468927C2EE39E1DCCD4765E1C3D676A335BE1CCD6900A45F5D41A317648315D8A8C24ADC64EB285F6AEBA05B9029586353D303F17A807658B9FF790474E1737BD5FDC604AEFF8DFCAF1427DCC3AACBB0256BADCD183ED75A2DC52452F87D3C1ED2AA583472B0AB91CDA20614E9B6FDBDA3B49B098C95823CC72D8E5B717F2314B0324E9CE',
        'AE6DEB5D6CE43D4B09D0E6B1C0E9F46157BCD8AB50EAA3197FF9FA2BF7AF649EB52C68544FD3ADFE6B1EB316F1F23538D470C30DBFEC7E57B60CBCD096C782E7736B669199C8253E70214CF2A098FDA8EAC5DA79A9496A3AAE754D03B17C6D70D1027F42BF7F95CE3D1D9C338854E158FCC803E4D6262FB639521E47116EF78A7A437CA9427BA645CD646832FEAB822A208278E45E93E118D780B988D65397EDDFD7A819526E'
    ],
    [
        'Adaintum 17',
        'D74636E3413A88D85F322CA80FB0BD650BD0BF0134E2329160B69609CD58A4B0',
        'EFB606AA1D9D9F0F465EAA7F8165F1AC09F5CB46FECF2A57',
        U64.fromInt(0),
        'F85471B75F6EC81ABAC2799EC09E98E280B2FFD64CA285E5A0109CFB31FFAB2D617B2C2952A2A8A788FC0DA2AF7F530758F74F1AB56391AB5FF2ADBCC5BE2D6C7F49FBE8118104C6FF9A23C6DFE52F57954E6A69DCEE5DB06F514F4A0A572A9A8525D961DAE72269B987189D465DF6107119C7FA790853E063CBA0FAB7800CA932E258880FD74C33C784675BEDAD0E7C09E9CC4D63DD5E9713D5D4A0196E6B562226AC31B4F57C04F90A181973737DDC7E80F364112A9FBB435EBDBCABF7D490CE52',
        'B2B795FE6C1D4C83C1327E015A67D4465FD8E32813575CBAB263E20EF05864D2DC17E0E4EB81436ADFE9F638DCC1C8D78F6B0306BAF938E5D2AB0B3E05E735CC6FFF2D6E02E3D60484BEA7C7A8E13E23197FEA7B04D47D48F4A4E5944174539492800D3EF51E2EE5E4C8A0BDF050C2DD3DD74FCE5E7E5C37364F7547A11480A3063B9A0A157B15B10A5A954DE2731CED055AA2E2767F0891D4329C426F3808EE867BED0DC75B5922B7CFB895700FDA016105A4C7B7F0BB90F029F6BBCB04AC36AC16'
    ],
    [
        'libsodium 2',//via: https://github.com/mafintosh/xsalsa20/blob/master/test.js
        '1B27556473E985D462CD51197A9A46C76009549EAC6474F206C4EE0844F68389',
        '69696EE955B62B73CD62BDA875FC73D68219E0036B7A0B37',
        U64.fromInt(0),
        '0000000000000000000000000000000000000000000000000000000000000000',
        'EEA6A7251C1E72916D11C2CB214D3C252539121D8E234E652D651FA4C8CFF880'
    ],
    
    [
        'stablelib-xsalsa20 - test 1',//via: https://github.com/StableLib/stablelib
        '000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F',
        'FFFEFDFCFBFAF9F8F7F6F5F4F3F2F1F0EFEEEDECEBEAE9E8',
        U64.fromInt(0),
        '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
        '300885CCE813D8CDBE05F89706F9D5557041E4FADC3EBC5DB89C6CA60F73EDE4F91FF1F9521D3E9AF058E037E7FD0601DB9CCBD7A9F5CED151426FDE32FC544F4F95576E2614377049C258664845A93D5FF5DD479CFEB55C7579B60D419B8A8C03DA3494993577B4597DCB658BE52AB7'
    ],

];
for(const [descr,key,nonce,counter,plain,enc] of testEnc) {
    tsts(`enc(${descr})`,()=>{
        const cc=new XSalsa20(hex.toBytes(key),hex.toBytes(nonce),counter);
        const pBytes=hex.toBytes(plain);
        const eBytes=new Uint8Array(pBytes.length);
        cc.encryptInto(eBytes,pBytes);
        assert.equal(hex.fromBytes(eBytes),enc);
    });
    tsts(`dec(${descr})`,()=>{
        const cc=new XSalsa20(hex.toBytes(key),hex.toBytes(nonce),counter);
        const eBytes=hex.toBytes(enc);
        const pBytes=new Uint8Array(eBytes.length);
        cc.decryptInto(pBytes,eBytes);
        assert.equal(hex.fromBytes(pBytes),plain);
    });
}

tsts.run();