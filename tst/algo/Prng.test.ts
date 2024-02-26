import { suite } from 'uvu';
import { RandTk } from '../../src/algo';
import { Assert } from '../../src/test';

const tsts = suite('RandTk');

// NOTE we aren't trying to test the distribution of the random function,
// just catch extreme values (eg where one value is never generated)
// NOTE: Sample size has to be reasonable (if we're generating 7 random numbers
// but have 14 buckets we'll see 100%+ error (some 0, some maybe 2))
const rand = new RandTk(Math.random);

const intSet = [
	[0, 10, 100000],
	[0, 100, 100000],
	[0, 8, 100000],
];

for (const set of intSet) {
	const [lowInc, highExc, sampleSize] = set;

	//A perfect distribution (each number the same number of times)
	const perfectDist = sampleSize / (highExc - lowInc);

	tsts(`monte carlo int[${lowInc},${highExc}) *${sampleSize}:`, () => {
		const counts = new Uint32Array(highExc);
		let sum = 0;
		//Generate numbers and measure
		for (let i = 0; i < sampleSize; i++) {
			const n = rand.intBetween(lowInc, highExc);
			Assert.inClosedOpen(n, lowInc, highExc);
			sum += n;
			//assert.equal(n >= lowInc && n < highExc, true, 'Number in range');
			counts[n]++;
		}

		//Because of quantized distribution the smaller the generation range
		// the more an extra value will move the average.
		//
		// [0-8) avg is 28/8=3.5 (because 8 cannot be generated)
		// Say 9 numbers = 0,1,2,3,4,5,6,7,7 avg=35/9=3.89 or 11% higher
		// Say 10 numbers = 0,1,2,3,4,5,6,7,7,7 avg=42/10=4.2 or 20% higher
		// While those generations are unlikely, and the most extreme (extra
		// numbers generated are furthest from the average) they're not impossible.
		// It can be smoothed out by more samples, but not eliminated
		const expectAvg = (highExc - 1 - lowInc) / 2;
		const foundAvg = sum / sampleSize;
		Assert.equalish(foundAvg, expectAvg, { percent: 3 });

		//Assert sample reasonable
		for (let i = 0; i < highExc; i++) {
			//Again quantization and sampleSize come into play
			Assert.equalish(counts[i], perfectDist, { percent: 15 });
		}
	});
}

const floatSet = [[0, 10, 100000]];
for (const set of floatSet) {
	const [lowInc, highExc, sampleSize] = set;

	tsts(`float[${lowInc},${highExc}) *${sampleSize}:`, () => {
		//Generate numbers
		let sum = 0;
		for (let i = 0; i < sampleSize; i++) {
			const n = rand.floatBetween(lowInc, highExc);
			sum += n;
			Assert.inClosedOpen(n, lowInc, highExc);
		}
		const expectAvg = (highExc - lowInc) / 2;
		const foundAvg = sum / sampleSize;
		//Because the values aren't quantized, the float average
		// should be much closer to the expected average
		Assert.equalish(foundAvg, expectAvg, { percent: 0.6 });
	});
}

tsts.run();
