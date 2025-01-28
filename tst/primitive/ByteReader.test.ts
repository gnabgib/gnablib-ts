import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { ByteReader } from '../../src/primitive/ByteReader';
import { hex } from '../../src/codec';
import util from 'util';

const tsts = suite('ByteReader');

const b0=new Uint8Array(0);

const read_tests:[string,number,string][]=[
    ['',0,''],
    ['03000000',1,'03'],
    ['01020304',1,'01'],
    ['01020304',2,'0102'],
    ['01020304',3,'010203'], 
    ['01020304',4,'01020304'], 
];
for(const [data,count,expect] of read_tests) {
    const bytes=hex.toBytes(data);
    const br=ByteReader.mount(bytes);
    tsts(`(${data}).read(${count})`,()=>{        
        assert.is(br.unread,bytes.length);
        const res=br.read(count);
        assert.is(hex.fromBytes(res),expect);
        assert.is(br.unread,bytes.length-res.length);
    });
}
const bad_read_tests:[string,number][]=[
    ['',1],
    ['01020304',5], 
    ['01020304',-1], 
    ['01020304',1.1], 
];
for(const [data,count] of bad_read_tests) {
    const bytes=hex.toBytes(data);
    const br=ByteReader.mount(bytes);
    tsts(`(${data}).read(${count}) throws`,()=>{
        assert.throws(()=>br.read(count));
    });
}

const rest_tests:[string,number,string][]=[
    ['01020304',1,'020304'],
    ['01020304',3,'04'],
    ['01020304',4,''],
];
for(const [dataHex,skip,restHex] of rest_tests) {
    const bytes=hex.toBytes(dataHex);
    const br=ByteReader.mount(bytes);
    tsts(`(${dataHex}).skip(${skip}).rest()`,()=>{        
        br.skip(skip);
        assert.is(br.unread,bytes.length-skip);
        assert.is(hex.fromBytes(br.rest()),restHex);
        assert.is(br.unread,0);
    });
}
const bad_skip_4B_tests:number[]=[
    -1,//Can only skip forward
    5//Can only skip up to remaining space (which is 4 on an empty buffer)
];
for(const skip of bad_skip_4B_tests) {
    tsts(`[4].skip(${skip}) throws`,()=>{
        const bytes=new Uint8Array(4);
        const br=ByteReader.mount(bytes);
        assert.throws(()=>br.skip(skip));
    })
    
}

tsts('[Symbol.toStringTag]', () => {
    const bw=ByteReader.mount(b0);
    assert.is(Object.prototype.toString.call(bw).indexOf("ByteReader")>0,true,'toString is set');
});

tsts('util.inspect',()=>{
    const bw=ByteReader.mount(b0);
    const u=util.inspect(bw);
    assert.is(u.startsWith('ByteReader('),true);
});

tsts.run();
