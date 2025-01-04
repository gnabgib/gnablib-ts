import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { splitMix64 } from '../../src/prng/splitMix64';
import { U64 } from '../../src/primitive/number/U64';
import { hex } from '../../src/codec';

const tsts = suite('splitMix64');
//https://gee.cs.oswego.edu/dl/papers/oopsla14.pdf
//https://rosettacode.org/wiki/Pseudo-random_numbers/Splitmix64
const seq_1234567: string[] = [
    '599ED017FB08FC85',
    '2C73F08458540FA5',
    '883EBCE5A3F27C77',
    '3FBEF740E9177B3F',
    'E3B8346708CB5ECD'
];

const seed=U64.fromInt(1234567);
const rng = splitMix64(seed);
let i = 0;
for (const expect of seq_1234567) {
	const act = rng();
	tsts(`splitMix64(1234567)[${i}]`, () => {
        //todo: U64 comparison in assert
		assert.equal(hex.fromBytes(act.toBytesBE()), expect);
	});
	i++;
}

const seq_0:string[] = [
    'E220A8397B1DCDAF',
    '6E789E6AA1B965F4',
    '06C45D188009454F',
    'F88BB8A8724C81EC',
    '1B39896A51A8749B',
    '53CB9F0C747EA2EA',
    '2C829ABE1F4532E1',
    'C584133AC916AB3C',
    '3EE5789041C98AC3',
    'F3B8488C368CB0A6',
    '657EECDD3CB13D09',
    'C2D326E0055BDEF6',
    '8621A03FE0BBDB7B',
    '8E1F7555983AA92F',
    'B54E0F1600CC4D19',
    '84BB3F97971D80AB',
    '7D29825C75521255',
    'C3CF17102B7F7F86',
    '3466E9A083914F64',
    'D81A8D2B5A4485AC',
    'DB01602B100B9ED7',
    'A9038A921825F10D',
    'EDF5F1D90DCA2F6A',
    '54496AD67BD2634C',
    'DD7C01D4F5407269',
    '935E82F1DB4C4F7B',
    '69B82EBC92233300',
    '40D29EB57DE1D510',
    'A2F09DABB45C6316',
    'EE521D7A0F4D3872',
    'F16952EE72F3454F',
    '377D35DEA8E40225',
    '0C7DE8064963BAB0',
    '05582D37111AC529',
    'D254741F599DC6F7',
    '69630F7593D108C3',
    '417EF96181DAA383',
    '3C3C41A3B43343A1',
    '6E19905DCBE531DF',
    '4FA9FA7324851729',
    '84EB4454A792922A',
    '134F7096918175CE',
    '07DC930B302278A8',
    '12C015A97019E937',
    'CC06C31652EBF438',
    'ECEE65630A691E37',
    '3E84ECB1763E79AD',
    '690ED476743AAE49',
    '774615D7B1A1F2E1',
    '22B353F04F4F52DA',
    'E3DDD86BA71A5EB1',
    'DF268ADEB6513356',
    '2098EB73D4367D77',
    '03D6845323CE3C71',
    'C952C5620043C714',
    '9B196BCA844F1705',
    '30260345DD9E0EC1',
    'CF448A5882BB9698',
    'F4A578DCCBC87656',
    'BFDEAED9A17B3C8F',
    'ED79402D1D5C5D7B',
    '55F070AB1CBBF170',
    '3E00A34929A88F1D',
    'E255B237B8BB18FB',
    '2A7B67AF6C6AD50E',
    '466D5E7F3E46F143',
    '42375CB399A4FC72',
    '8C8A1F148A8BB259',
    '32FCAB5DAED5BDFC',
    '9E60398C8D8553C0',
    'EE89CCEB8C4064C0',
    'DB0215941D86A66F',
    '5CCDE78203C367A8',
    'F1BCBC6A1EC11786',
    'EF054FCEEE954551',
    'DF82012D0555C6DF',
    '292566FF72403C08',
    'C4DD302A1BFA1137',
    'D85F219DB5C554E1',
    '6A27FF807441BCD2',
    '96A573E9B48216E8',
    '46A9FDAC40BF0048',
    '3DD12464A0EE15B4',
    '451E521296A7EEA1',
    '56E4398A98F8A0FD',
    '7B7DC2160E3335A7',
    'C679EE0BEBCB1CCA',
    '928D6F2D7453424E',
    '1B38994205234C6D',
    '8086D193A6F2B568',
    '21C6E26639AC2C65',
    'D9DCCAC414D23C6F',
    '91CD642057E00235',
    '77FC607DC6589373',
    '05B8ABE26DD3AEE7',
    '12F6436AC376CC66',
    '64952424897B2307',
    'EE8C2BAF6343E5C3',
    'DC4C613D9EBA2304',
    '3505B7796BD1A506',
];

const rng2=splitMix64();
i = 0;
for (const expect of seq_0) {
	const act = rng2();
	tsts(`splitMix64(0)[${i}]`, () => {
		assert.equal(hex.fromBytes(act.toBytesBE()), expect);
	});
	i++;
}

tsts.run();