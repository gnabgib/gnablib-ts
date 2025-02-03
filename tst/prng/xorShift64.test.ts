
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { XorShift64 } from '../../src/prng/xorShift64';
import { U64 } from '../../src/primitive/number/U64';
import { hex } from '../../src/codec/Hex';

const tsts = suite('XorShift64');
//https://www.jstatsoft.org/article/view/v008i14
//These test vectors were found in another library, sourced from the CPP reference impl
const seq_1: string[] = [
    '0000000040822041',
    '100041060C011441',
    '9B1E842F6E862629',
    'F554F503555D8025',
    '860C1FB090599265',
    'F6B05302E5531801',
    'A2460108EBBD9E71',
    'C62C9FC114D9590D',
    '7D3E032E9A7908FF',
    '73A397E1324C252E',
    '1CCAC1C38A4C36E4',
    'EFAD64F8379B9789',
    '4E2AA10F962C62E6',
    '90E459E5090243A3',
    '8986DEDD543CCFE4',
    'CF9D3E05E6ADCF7B',
    '1B26C62DABB62A25',
    'A91F05E3064D6F31',
    '0EF1DE18CDA219AF',
    '711F0D367B32D65C',
];
const rng_1=XorShift64.seed(U64.fromI32s(1,0));
let i = 0;
for (const expect of seq_1) {
	const act = rng_1.rawNext();
	tsts(`XorShift64(1).rawNext[${i}]`, () => {
        assert.equal(hex.fromBytes(act.toBytesBE()), expect);
	});
	i++;
}

const seq_11234: string[] = [
    '00000AED231C9335',
    '2AF84DE222BEC753',
    '204FA2E68D9A0E1D',
    '7EDD9A315D431D41',
    'C1F49FD7DAE0EB3B',
    'A22FD853D852842D',
    '89A99F922F0C8A65',
    '60A1DFBE0D5EAA31',
    '3FB3557885E2BB25',
    'AF28CB0975051713',
    '5BE07EF3F7B2B9FD',
    'AC9D2B9DAC5003CE',
    '8FAA45C8A3E39049',
    '28B20785721B6529',
    '31B90993E1C539A3',
    'D62A43B9665CBB10',
    '3439FC159810C666',
    '78BF6632D309BE6A',
    '09074831AC217796',
    '1F5CACE2C82410F9',
];
const rng_11234=XorShift64.seed(U64.fromI32s(11234,0));
i = 0;
for (const expect of seq_11234) {
	const act = rng_11234.rawNext();
	tsts(`XorShift64(11234).rawNext[${i}]`, () => {
        assert.equal(hex.fromBytes(act.toBytesBE()), expect);
	});
	i++;
}

//Unsourced, but shows that without a seed reasonable PRNG are generated
const seq_def:string[] =[
    '79690975FBDE15B0',
    '2A337357AE2CC59B',
    '2FEF107A27529AD0',
    'E4093DF8432A8BE5',
]
const rng_def=XorShift64.new();
i=0;
for (const expect of seq_def) {
	const act = rng_def.rawNext();
	tsts(`XorShift64().rawNext[${i}]`, () => {
        assert.equal(hex.fromBytes(act.toBytesBE()), expect);
	});
	i++;
}

tsts(`XorShift64(,false) save returns empty, restore throws`,()=>{
    const r=XorShift64.new();
    const sav=r.save();
    assert.equal(sav.length,0);
    assert.throws(()=>XorShift64.restore(sav));
})

tsts(`XorShift64().save/restore loop`,()=>{
    const r=XorShift64.new(true);
    assert.equal(r.rawNext().toString(),seq_def[0],'r consume[0]');
    const sav=r.save();
    assert.equal(sav.length,8,'save length');
    assert.equal(r.rawNext().toString(),seq_def[1],'r consume[1]');
    assert.equal(r.rawNext().toString(),seq_def[2],'r consume[2]');

    const r2=XorShift64.restore(sav);    
    assert.equal(r2.rawNext().toString(),seq_def[1],'r2 still at [1]');
    assert.equal(r.rawNext().toString(),seq_def[3],'r consume[3]');

    assert.is(Object.prototype.toString.call(r).indexOf("xorshift64")>0,true,'toString is set');
});

tsts.run();
