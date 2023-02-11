import { suite } from 'uvu';
import wtRnd from '../../src/algo/WeightRand';
import assert from '../../src/test/assert';

const tsts = suite('WeightRand');

const relativeSet: { wts: number[]; ss: number }[] = [
	//Pointless (equal values, just random)
	{ wts: [1, 1, 1, 1, 1], ss: 100000 },
	//Almost pascal, 4 choices, 3rd ~= sum(1,2), 4th ~= sum(1,2,3)
	{ wts: [1, 1, 2, 4], ss: 1000000 },
	//Alright.. pascal's triangle
	{
		wts: [1, 1, 1, 1, 2, 1, 1, 3, 3, 1, 1, 4, 6, 4, 1, 1, 5, 10, 10, 5, 1],
		ss: 1000000,
	},
	{ wts: [0, 1, 2], ss: 100000 },
];

for (const set of relativeSet) {
	const { wts, ss: sampleSize } = set;
	const wtCount = wts.length;
	let wtMax = 0;
	for (let i = 0; i < wts.length; i++) wtMax += wts[i];

	tsts(`wtRnd.relative([${wts}] =${wtMax}) *${sampleSize}:`, () => {
		const counts = new Uint32Array(wtCount);
		for (let i = 0; i < sampleSize; i++) {
			const n = wtRnd.relative(wts, Math.random);
			assert.inClosedOpen(n, 0, wtCount);
			counts[n]++;
		}

		//Assert sample reasonable
		for (let i = 0; i < wtCount; i++) {
			//2.5% error margin
            assert.equalish(counts[i],(wts[i] / wtMax) * sampleSize,{percent:2.5},`wt[${i}]`)
			//assertEqualish(counts[i], (wts[i] / wtMax) * sampleSize, 2.5, `wt[${i}]`);
		}
	});
}

const cumulativeSet: { wts: number[]; ss: number }[] = [
	//Pointless (equal values, just random)
	{ wts: [1, 2, 3, 4, 5], ss: 100000 },
	{ wts: [1, 2, 4, 8], ss: 100000 },
];

for (const set of cumulativeSet) {
	const { wts, ss: sampleSize } = set;
	const wtCount = wts.length;
	const wtMax = wts[wts.length - 1];

	tsts(`wtRnd.cumulative([${wts}]) *${sampleSize}:`, () => {
		const counts = new Uint32Array(wtCount);
		for (let i = 0; i < sampleSize; i++) {
			const n = wtRnd.cumulative(wts, Math.random);
			assert.inClosedOpen(n, 0, wtCount);
			counts[n]++;
		}

		//Assert sample reasonable
		let pastWt = 0;
		for (let i = 0; i < wtCount; i++) {
			//2.5% error margin
			assert.equalish(
				counts[i],
				((wts[i] - pastWt) / wtMax) * sampleSize,
				{percent:2.5},
				`wt[${i}]`
			);
			pastWt = wts[i];
		}
	});
}

// NOTE we aren't trying to test the distribution of the random function,
// just catch extreme values (eg where one value is never generated)
// NOTE: Sample size has to be reasonable (if we're generating 7 random numbers
// but have 14 buckets we'll see 100%+ error (some 0, some maybe 2))

tsts.run();
