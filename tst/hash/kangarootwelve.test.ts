import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../src/encoding/Hex';
import { KangarooTwelve } from '../../src/hash/KangarooTwelve';

const tsts = suite('KangarooTwelve');

function ptn(len:number):Uint8Array {
    const ret=new Uint8Array(len);
    let ptr=0;
    while(len>0) {
        const n = len>251?251:len;
        for(let i=0;i<n;i++) {
            ret[ptr++]=i;            
        }
        len-=n;
    }
    return ret;
}
const tests:{
    data:Uint8Array,//m
    size:number,//l
    customize?:Uint8Array,//C
    expect:string
}[]=[
    //https://www.ietf.org/archive/id/draft-irtf-cfrg-kangarootwelve-10.html#name-test-vectors
    //https://github.com/XKCP/XKCP/blob/master/tests/TestVectors/KangarooTwelve.txt
    {
        data:new Uint8Array(0),
        size:32,
        expect:'1AC2D450FC3B4205D19DA7BFCA1B37513C0803577AC7167F06FE2CE1F0EF39E5'
    },
    {
        data:new Uint8Array(0),
        size:64,
        expect:'1AC2D450FC3B4205D19DA7BFCA1B37513C0803577AC7167F06FE2CE1F0EF39E54269C056B8C82E48276038B6D292966CC07A3D4645272E31FF38508139EB0A71'
    },
    {
        data:Uint8Array.of(0),
        size:32,
        expect:'2BDA92450E8B147F8A7CB629E784A058EFCA7CF7D8218E02D345DFAA65244A1F'

    },
    {
        data:ptn(17),
        size:32,
        expect:'6BF75FA2239198DB4772E36478F8E19B0F371205F6A9A93A273F51DF37122888'
    },
    {
        data:ptn(17*17),//289
        size:32,
        expect:'0C315EBCDEDBF61426DE7DCF8FB725D1E74675D7F5327A5067F367B108ECB67C'
    },
    {
        data:ptn(17*17*17),//4913
        size:32,
        expect:'CB552E2EC77D9910701D578B457DDF772C12E322E4EE7FE417F92C758F0D59D0'
    },
    {
        //Exceeds blocks: Sakura tree hash
        data:ptn(17*17*17*17),//83521
        size:32,
        expect:'8701045E22205345FF4DDA05555CBB5C3AF1A771C2B89BAEF37DB43D9998B9FE'
    },
    //KangarooTwelve(M=ptn(17**5 bytes), D=`07`, 32):
    //KangarooTwelve(M=ptn(17**6 bytes), D=`07`, 32):
    {
        data:new Uint8Array(0),
        size:32,
        customize:ptn(1),
        expect:'FAB658DB63E94A246188BF7AF69A133045F46EE984C56E3C3328CAAF1AA1A583'
    },
    {
        data:Uint8Array.of(0xff),
        size:32,
        customize:ptn(41),
        expect:'D848C5068CED736F4462159B9867FD4C20B808ACC3D5BC48E0B06BA0A3762EC4'
    },
    {
        data:Uint8Array.of(0xff,0xff,0xff),
        size:32,
        customize:ptn(41*41),
        expect:'C389E5009AE57120854C2E8C64670AC01358CF4C1BAF89447A724234DC7CED74'
    },
    {
        //Exceeds block: Sakura tree hash
        data:Uint8Array.of(0xff,0xff,0xff,0xff,0xff,0xff,0xff),
        size:32,
        customize:ptn(41*41*41),
        expect:'75D2F86A2E644566726B4FBCFC5657B9DBCF070C7B0DCA06450AB291D7443BCF'
    },
    {
        data:ptn(8191),
        size:32,
        expect:'1B577636F723643E990CC7D6A659837436FD6A103626600EB8301CD1DBE553D6'
    },
    {
        //Exceeds block: Sakura tree hash
        data:ptn(8192),
        size:32,
        expect:'48F256F6772F9EDFB6A8B661EC92DC93B95EBD05A08A17B39AE3490870C926C3'
    },
    {
        //Exceeds block: Sakura tree hash
        data:ptn(8192),
        size:32,
        customize:ptn(8189),
        expect:'3ED12F70FB05DDB58689510AB3E4D23C6C6033849AA01E1D8C220A297FEDCD0B'
    },
    {
        //Exceeds 2block: Sakura tree hash
        data:ptn(8192),
        size:32,
        customize:ptn(8190),
        expect:'6A7C1B6A5CD0D8C9CA943A4A216CC64604559A2EA45F78570A15253D67BA00AE'
    },
];


let count=0;
for (const test of tests) {
    tsts(`KangarooTwelve[${count++}]`,()=>{
        //const c=test.customize?hex.toBytes(test.customize):undefined;
		const hash=new KangarooTwelve(test.size,test.customize);
		hash.write(test.data);
		const md=hash.sum();
		assert.is(hex.fromBytes(md), test.expect);
	});
}

tsts(`KangarooTwelve(size=10032):last32`,()=>{
    const hash=new KangarooTwelve(10032);
    hash.write(new Uint8Array(0));
    const md=hash.sum();
    assert.is(hex.fromBytes(md.subarray(md.length-32)), 'E8DC563642F7228C84684C898405D3A834799158C079B12880277A1D28E2FF6D');
})

tsts.run();
