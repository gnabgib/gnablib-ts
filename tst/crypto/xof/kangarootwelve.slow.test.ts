import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { KangarooTwelve } from '../../../src/crypto/xof';

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
        data:ptn(17**4),//83521
        size:32,
        expect:'8701045E22205345FF4DDA05555CBB5C3AF1A771C2B89BAEF37DB43D9998B9FE'
    },
    {
        data:ptn(17**5),//1419857
        size:32,
        expect:'844D610933B1B9963CBDEB5AE3B6B05CC7CBD67CEEDF883EB678A0A8E0371682'
    },
    // This passes, but it takes ~3.5s, probably because data is a 24MB chunk, so
    // we'll leave it commented out as part of the default deep
    // {
    //     data:ptn(17**6),//24137569
    //     size:32,
    //     expect:'3C390782A8A4E89FA6367F72FEAAF13255C8D95878481D3CD8CE85F58E880AF8'
    // },
    {
        data:Uint8Array.of(0xff,0xff,0xff,0xff,0xff,0xff,0xff),
        size:32,
        customize:ptn(41**3),
        expect:'75D2F86A2E644566726B4FBCFC5657B9DBCF070C7B0DCA06450AB291D7443BCF'
    },
    //3.7s
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

tsts.run();
