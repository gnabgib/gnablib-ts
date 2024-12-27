import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { xorShift128 } from '../../src/prng/xorShift';

const tsts = suite('xorShift128');
//https://www.jstatsoft.org/article/view/v008i14
//These test vectors were found in another library, sourced from the CPP reference impl
const seq_123456789: number[] = [
	3701687786, 458299110, 2500872618, 3633119408, 516391518, 2377269574,
	2599949379, 717229868, 137866584, 395339113, 1301295572, 1728310821,
	3538670320, 1187274473, 2316753268, 4061953237, 2129415220, 448488982,
	643481932, 934407046,
];

const rng_123456789 = xorShift128(123456789);
let i = 0;
for (const expect of seq_123456789) {
	const act = rng_123456789();
	tsts(`xorShift128(123456789)[${i}]`, () => {
		assert.equal(act, expect);
	});
	i++;
}

const seq_2579111315: number[] = [
	1280753804, 2342814110, 98946252, 1215862728, 3000003819, 500671326,
	914329476, 3124074580, 2343767245, 736002998, 3776391910, 4160158120,
	3828373247, 992787196, 1664411493, 592406802, 1169048618, 453766457,
	3753914098, 2275396577,
];

const rng_2579111315 = xorShift128(2579111315);
i = 0;
for (const expect of seq_2579111315) {
	const act = rng_2579111315();
	tsts(`xorShift128(2579111315)[${i}]`, () => {
		assert.equal(act, expect);
	});
	i++;
}

tsts.run();
