import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../src/encoding/Hex';
import { utf8 } from '../../src/encoding/Utf8';
import { HopMac } from '../../src/mac/HopMac';

const tsts = suite('HopMAC');

type hashHex={
    key:string,
    data:string|Uint8Array,
    size?:number,
    customize?:string,
    expect:string
};

const tests:hashHex[]=[
    //[~]
    {
        key:'test',
        data:'hello',
        expect:'17F7AE81F9C3DCD02B1AE73483E0746288FEBFDBCC2A1DD75906CCF67C683E69'
    },
    {
        key:'gnabgib',
        data:'Hello',
        expect:'F0375C5A5DCB57D537886838F33A921BEEC6D1C95B8B479AD1F781706DB7B91F'
    },
    {
        key:'gnabgib',
        data:'Hello',
        size:33,
        expect:'573F684F8745C0442EF2358BF115471760704093CC6381FAEBD195BE7235E2170E'
    },
    {
        key:'gnabgib',
        data:'Hello',
        size:64,
        expect:'41A52EDCA21849474AC88BB8035851F8E3F756113B6F6AEBF196122D64F0303CD552C2D217488585F78F9C222F22125024F3103D442D0EF9CE52ABB19BF62016'
    },
];

let count=0;
for (const test of tests) {
    tsts(`mac[${count++}]`,()=>{
        const mac=new HopMac(test.size??32,test.key,test.customize);
        const bMsg=test.data instanceof Uint8Array ? test.data : utf8.toBytes(test.data);
        mac.write(bMsg);
        const found=mac.sum();
        assert.is(hex.fromBytes(found),test.expect);
    });
}

tsts(`mac /w byte key`,()=>{
    const idiotsLuggage=new HopMac(32,Uint8Array.of(1,2,3,4));
    idiotsLuggage.write(Uint8Array.of(5,6,7,8));
    const found=idiotsLuggage.sum();
    assert.is(hex.fromBytes(found),'3B14A381F15C9917A55EBF6A9154358FC623BA9A44E64E175AF3CAD61800C51E');
})

tsts.run();
