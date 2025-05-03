import { suite } from 'uvu';
import * as assert from 'uvu/assert'
import * as scream from '../../src/codec/Scream';


//https://xkcd.com/3054/

const tsts = suite('Scream-Cipher/XKCD3054');

const encode_tests:[string,string][]=[
    //Note the font needs to support a lot of diacritics which isn't guaranteed
    ['hello world','a̰áăăå ȁåȃăa̱'],
    [
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        'AȦA̧A̱ÁA̮A̋A̰ẢA̓ẠĂǍÂÅA̯A̤ȂÃĀÄÀȀA̽A̦A̸',
    ],

    [
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
        'AȦA̧A̱ÁA̮A̋A̰ẢA̓ẠĂǍÂÅA̯A̤ȂÃĀÄÀȀA̽A̦A̸aȧa̧a̱áa̮a̋a̰ảa̓ạăǎâåa̯a̤ȃãāäàȁa̽a̦a̸0123456789',
    ],
    ['a','a'],
    ['A','A'],
    ['b','ȧ'],
    ['B','Ȧ'],

    ['h','a̰'],
    ['e','á'],
    ['l','ă'],
    ['o','å'],
    ['w','ȁ'],
    ['r','ȃ'],
    ['d','a̱'],
    ['z','a̸'],
    ['gnabgib', 'a̋âaȧa̋ảȧ'],
    ['a̅h!','a̅a̰!'],//other dia on a survives
    ['zöe','a̸å̈á'],//dia on the o is double encoded
    //If the input includes non-dia characters, they aren't touched
    ['Côtes','A̧ôāáã'],
    //Dia version (yes I know you can't tell in most editors)
    ['Côtes','A̧å̂āáã'],

    //From the comic
    ['HELLO','A̰ÁĂĂÅ'],
    ['HI','A̰Ả'],
    ['AAAAAA A SCARY MONSTER AAAAAAA!','AAAAAA A ÃA̧AȂA̦ ǍÅÂÃĀÁȂ AAAAAAA!']
];
for(const [plain,enc] of encode_tests) {
    tsts(`encode(${plain})`,()=>{
        const find=scream.encode(plain);
        assert.is(find,enc,`<${find}>`);
    });
    tsts(`decode(${plain})`,()=>{
        const dec=scream.decode(enc);
        assert.is(dec,plain,`<${dec}>`);
    });
    tsts(`enc loop`,()=>{
        const pass=scream.decode(scream.encode(plain));
        assert.is(pass,plain);
    });
}

const alt_decodes:[string,string][]=[
    //Not using diacritics (so won't encode back to same)
    ['aȧȧa','abba'],
];
for(const [enc,plain] of alt_decodes) {
    tsts(`decode(${plain})`,()=>{
        const dec=scream.decode(enc);
        assert.is(dec,plain);
    })
}

tsts.run();
