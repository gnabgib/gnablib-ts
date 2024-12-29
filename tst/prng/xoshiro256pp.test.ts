import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { xoshiro256pp } from '../../src/prng/xoshiro256';
import { U256, U64 } from '../../src/primitive/number';
import { hex } from '../../src/codec/Hex';

const tsts = suite('xoshiro256++');
//Sourced from another repo that implements xoshiro256++
//https://gitgud.io/anglekh/prng-xoshiro/-/blob/master/test/test.js?ref_type=heads 10213
const seq0: string[] = [
    '53175D61490B23DF',
    '61DA6F3DC380D507',
    '5C0FDF91EC9A7BFC',
    '02EEBF8C3BBE5E1A',
    '7ECA04EBAF4A5EEA',
    '0543C37757F08D9A',
    'DB7490C75AB5026E',
    'D87343E6464BC959',
    '4B7DA0A02389F0FF',
    '1300FC58C0424C16',
    '5084843206C19968',
    '10EA073DE9AA4DFC',
    '1AAE554343960CC1',
    '1804139F10FAE720',
    '10D790E7B8AC10FA',
    '667D2BFFDD1496F7',
    'A04620D3D0FC04A8',
    '1D50881230AF9CC3',
    '53BE287DED35F698',
    '673235793F7908E1',
];

const rng0 = xoshiro256pp();
let i = 0;
for (const expect of seq0) {
	const act = rng0();
	tsts(`xoshiro256++()[${i}]`, () => {
		assert.equal(hex.fromBytes(act.toBytesBE()), expect);
	});
	i++;
}


//Sourced from another repo that implements xoshiro256++
//https://gitgud.io/anglekh/prng-xoshiro/-/blob/master/test/test.js?ref_type=heads 5612
const seq_1: string[] = [
    '203C37B7CAEF40BA',
    'E37175D6E4B50DC1',
    'C9ACB234A4716244',
    '644DD17E4E82BEC2',
	'5AFD858E9BF9ADED',
	'115821A57A363613',
	'5B3389120FD5A727',
	'6A3E34447240D834',
	'8FD8B8F4F305E1E1',
	'2FB61DD0F5DFA6D5',
	'C84C42DFB97C70B6',
	'0CCDD497BBD12C43',
	'ABAE288671D9D72C',
	'03C095C2B55B842C',
	'DA4D1AE10E4DE9FC',
	'DAC0BF311F031C57',
	'8B265A95A7732C36',
	'CEAC80C020DCBBFA',
    'DE88940ED4198C8C',
	'13999C602F7C1112',
];

const rng_1 = xoshiro256pp(U256.fromU64Quad(
    U64.fromBytesBE(hex.toBytes('96a1743c36ed852f')),
    U64.fromBytesBE(hex.toBytes('8c0ac25732c50c9f')),
    U64.fromBytesBE(hex.toBytes('ec65ea85c2947a21')),
    U64.fromBytesBE(hex.toBytes('6cd5a2d6fe9971f9')),
));

i = 0;
for (const expect of seq_1) {
	const act = rng_1();
	tsts(`xoshiro256++(seed)[${i}]`, () => {
		assert.equal(hex.fromBytes(act.toBytesBE()), expect);
	});
	i++;
}

tsts.run();
