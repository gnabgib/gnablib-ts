
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { xorShift64 } from '../../src/prng/xorShift64';
import { U64 } from '../../src/primitive/number';
import { hex } from '../../src/codec/Hex';

const tsts = suite('xorShift64');
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

const rng_1 = xorShift64(U64.fromInt(1));
let i = 0;
for (const expect of seq_1) {
	const act = rng_1();
	tsts(`xorShift64(1)[${i}]`, () => {
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

const rng_11234 = xorShift64(U64.fromInt(11234));
i = 0;
for (const expect of seq_11234) {
	const act = rng_11234();
	tsts(`xorShift64(11234)[${i}]`, () => {
        assert.equal(hex.fromBytes(act.toBytesBE()), expect);
	});
	i++;
}

//Unsourced, but shows that without a seed reasonable PRNG are generated
const seq0:string[] =[
    '79690975FBDE15B0',
    '2A337357AE2CC59B',
    '2FEF107A27529AD0',
    'E4093DF8432A8BE5',
]
const rng0=xorShift64();
i=0;
for (const expect of seq0) {
	const act = rng0();
	tsts(`xorShift64()[${i}]`, () => {
        assert.equal(hex.fromBytes(act.toBytesBE()), expect);
	});
	i++;
}

tsts.run();
