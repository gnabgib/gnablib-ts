import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { ByteWriter } from '../../src/primitive/ByteWriter';
import { hex } from '../../src/codec';
import util from 'util';

const tsts = suite('ByteWriter');

const write_byte_tests:[number,string][]=[
    [3,'0300'],
    [0x123,'2300'],//Truncated
];
for(const [byte,expect] of write_byte_tests) {
    tsts(`writeByte(${byte})`,()=>{
        const fill=new Uint8Array(2);
        const bw=ByteWriter.mount(fill);
        assert.is(bw.space,2);
        assert.is(bw.tryWriteByte(byte),true);
        assert.is(hex.fromBytes(fill),expect);
    });
    tsts(`mustWriteByte(${byte})`,()=>{
        const fill=new Uint8Array(2);
        const bw=ByteWriter.mount(fill);
        bw.writeByte(byte)
        assert.is(hex.fromBytes(fill),expect);
    })
}
tsts(`mustWriteByte without space throws`,()=>{
    const bw=ByteWriter.size(0);
    assert.throws(()=>bw.writeByte(1));
    assert.is(bw.tryWriteByte(1),false);
})

const write_4B_tests:[string,string,boolean,boolean][]=[
    ['03','03000000',true,false],
    ['1234','12340000',true,false],
    ['01020304','01020304',true,true],
    ['0102030405','01020304',false,true],//Oversized writes but drops excess
];
for(const [data,expect,fits,full] of write_4B_tests) {
    const dataB=hex.toBytes(data);
    tsts(`write(${data})`,()=>{
        const fill=new Uint8Array(4);
        const bw=ByteWriter.mount(fill);
        assert.is(bw.space,4);
        assert.is(bw.tryWrite(dataB),fits);
        assert.is(hex.fromBytes(fill),expect);
        assert.is(bw.full,full);
    });
    tsts(`mustWrite(${data})`,()=>{
        const fill=new Uint8Array(4);
        const bw=ByteWriter.mount(fill);
        if (!fits) assert.throws(()=>bw.write(dataB));
        else {
            bw.write(dataB);
            assert.is(hex.fromBytes(fill),expect);
        }
    })
}

const skip_tests:[string,number,string,string,boolean][]=[
    ['00000000',0,'23','23000000',true],
    ['00000000',1,'23','00230000',true],
    ['00000000',4,'23','00000000',false],//Skip puts write out of range (will return false)
    ['11111111',1,'23','11231111',true],//The underlying buffer is not zeroed during skip
];
for(const [fillHex,skip,writeHex,expect,fits] of skip_tests) {
    tsts(`(${fillHex}).skip(${skip}).write(${writeHex})`,()=>{
        const fill=hex.toBytes(fillHex);
        const bw=ByteWriter.mount(fill);
        const data=hex.toBytes(writeHex);
        assert.is(bw.space,fill.length);
        bw.skip(skip);
        assert.is(bw.space,fill.length-skip);
        assert.is(bw.tryWrite(data),fits);
        assert.is(hex.fromBytes(fill),expect);
    })
}

tsts(`[4].write(0xff).sub(2).skip(1)`,()=>{
    const bytes=new Uint8Array(4);
    const bw=ByteWriter.mount(bytes);
    assert.is(bw.space,4);

    bw.tryWrite(Uint8Array.of(0xff));
    assert.is(bw.space,3);

    const sub=bw.sub(2);
    assert.is(bw.space,1);
    assert.is(sub.space,2);

    bw.skip(1);
    assert.is(bw.space,0);
    assert.is(bw.tryWrite(Uint8Array.of(0x56)),false);
    assert.is(hex.fromBytes(bytes),'FF000000');

    assert.is(sub.tryWrite(Uint8Array.of(0x12,0x34)),true);
    assert.is(sub.space,0);
    assert.is(hex.fromBytes(bytes),'FF123400');
});

tsts('[Symbol.toStringTag]', () => {
    const bw=ByteWriter.size(0);
    assert.is(Object.prototype.toString.call(bw).indexOf("ByteWriter")>0,true,'toString is set');
});

tsts('util.inspect',()=>{
    const bw=ByteWriter.size(0);
    const u=util.inspect(bw);
    assert.is(u.startsWith('ByteWriter('),true);
});

tsts.run();
