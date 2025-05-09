
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { XorShift128p } from '../../src/prng/xorShift128p';
import { U64 } from '../../src/primitive/number/U64';
import { hex } from '../../src/codec/Hex';

const tsts = suite('XorShift128+');
//https://www.jstatsoft.org/article/view/v008i14
//These test vectors were found in another library, sourced from the CPP reference impl
const seq_15: string[] = [
    '000000001CF622FA', 
    '0003ADE6892F3F0E',
    '000D2B8787ED8B6C',
    'F33CEAB17662DA00',
    '175D00B862C900F2',
    '82343DA666F2B118',
    '0ADDB675E2437F49',
    'B55F18CEB86F0138',
    'A8314EA944BCA00B',
    '57EF85B9CE157946',
    'C37393857A333528',
    '0C01D74EF1ABE863',
    '0605B64213ABA3E7',
    'A26FAE44A4A5B696',
    'B230DD119B5C8448',
    '25DAA28B998F9067',
    'FB502218C3339C99',
    '959E970F73AA7701',
    '9CB685AAC26271D1',
    '8170ABFAC60F741D',
];
const rng_15=XorShift128p.seed(U64.fromI32s(123456789,0),U64.fromI32s(362436069,0));
//0x000000000 159A55E5 00000000 075BCD15 / 6685765407924336135579094293
let i = 0;
for (const expect of seq_15) {
	const act = rng_15.rawNext();
	tsts(`XorShift128+(15).rawNext[${i}]`, () => {
        assert.equal(hex.fromBytes(act.toBytesBE()), expect);
	});
	i++;
}

const seq_25: string[] = [
    '00000000AF547378', 
    '004CDD1D87E964BC',
    '009153FB3FDCA959',
    '8EF8032A12161974',
    '731847E24AAE0396',
    '303B37B3FFA59DB5',
    'B2C5E98EA1BCA185',
    '87E228B19BB5B1DA',
    '20412541AD8C763C',
    '778DA8A6F8633C9E',
    'FD2CD9D7449757EC',
    '30D87FA258B63262',
    '5EC5F13DB50A5B98',
    'D6E9303B1AC0260F',
    '15D249BA4A63A761',
    '56DC38D5328258D1',
    '1755F166075245DC',
    '48A1EA4EA14E6296',
    'E53D50FBBB47EC3C',
    'B2AFD6425E980404',
];
const rng_25=XorShift128p.seed(U64.fromI32s(2579111315,0),U64.fromI32s(362436069,0));
//0x00000000 159A55E5 00000000 99BA1D93 / 6685765407924336138034748819
i = 0;
for (const expect of seq_25) {
	const act = rng_25.rawNext();
	tsts(`XorShift128+(25).rawNext[${i}]`, () => {
        assert.equal(hex.fromBytes(act.toBytesBE()), expect);
	});
	i++;
}

//Unsourced, but shows that without a seed reasonable PRNG are generated
const seq_def:string[] =[
	'509946A41CD733A3',
    '020EE24BB357EE47',
    '5FB8E9CD63BB975E',
    '757FCA8DFDD73032',
]
const rng_def=XorShift128p.new();
i=0;
for (const expect of seq_def) {
	const act = rng_def.rawNext();
	tsts(`XorShift128+().rawNext[${i}]`, () => {
        assert.equal(hex.fromBytes(act.toBytesBE()), expect);
	});
	i++;
}

tsts(`XorShift128+(,false) save returns empty, restore throws`,()=>{
    const r=XorShift128p.new();
    const sav=r.save();
    assert.equal(sav.length,0);
    assert.throws(()=>XorShift128p.restore(sav));
})

tsts(`XorShift128+().save/restore loop`,()=>{
    const r=XorShift128p.new(true);
    assert.equal(r.rawNext().toString(),seq_def[0],'r consume[0]');
    const sav=r.save();
    assert.equal(sav.length,16,'save length');
    assert.equal(r.rawNext().toString(),seq_def[1],'r consume[1]');
    assert.equal(r.rawNext().toString(),seq_def[2],'r consume[2]');

    const r2=XorShift128p.restore(sav);    
    assert.equal(r2.rawNext().toString(),seq_def[1],'r2 still at [1]');
    assert.equal(r.rawNext().toString(),seq_def[3],'r consume[3]');

    assert.is(Object.prototype.toString.call(r).indexOf("xorshift128+")>0,true,'toString is set');
});

tsts.run();
