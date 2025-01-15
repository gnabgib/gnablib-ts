import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Mcg } from '../../src/prng';

const tsts = suite('Mcg.randu');
//https://oeis.org/A096555
const seq_def: number[] = [
	65539, 393225, 1769499, 7077969, 26542323, 95552217, 334432395, 1146624417,
	1722371299, 14608041, 1766175739, 1875647473, 1800754131, 366148473,
	1022489195, 692115265, 1392739779, 2127401289, 229749723, 1559239569,
	845238963, 1775695897, 899541067, 153401569,
];
const rng_def = Mcg.newRandu();
let i = 0;
for (const expect of seq_def) {
	const act = rng_def.rawNext();
	tsts(`Mcg.randu().rawNext[${i}]`, () => {
		assert.equal(act, expect);
	});
	i++;
}
for (; i < 9998; i++) rng_def.rawNext();
tsts('Mcg.randu().rawNext[9999]', () => {
	assert.equal(rng_def.rawNext(), 57890411);
});

//Unsourced
const seq_42: number[] = [2752638, 16515450, 74318958, 297274698];
const rng_42 = Mcg.seedRandu(42);
i = 0;
for (const expect of seq_42) {
	const act = rng_42.rawNext();
	tsts(`Mcg.randu(42).rawNext[${i}]`, () => {
		assert.equal(act, expect);
	});
	i++;
}

tsts(`Mcg(,false) save returns empty, restore throws`, () => {
	const r = Mcg.newRandu();
	const sav = r.save();
	assert.equal(sav.length, 0);
	assert.throws(() => Mcg.restore(sav));
});

tsts(`Mcg().save/restore loop`, () => {
	const r = Mcg.newRandu(true);
	assert.equal(r.rawNext(), seq_def[0], 'r consume[0]');
	const sav = r.save();
	assert.equal(sav.length, 17, 'save length');
	assert.equal(r.rawNext(), seq_def[1], 'r consume[1]');
	assert.equal(r.rawNext(), seq_def[2], 'r consume[2]');

	const r2 = Mcg.restore(sav);
	assert.equal(r2.rawNext(), seq_def[1], 'r2 still at [1]');
	assert.equal(r.rawNext(), seq_def[3], 'r consume[3]');

	assert.is(
		Object.prototype.toString.call(r).indexOf('mcg') > 0,
		true,
		'toString is set'
	);
});

tsts.run();
