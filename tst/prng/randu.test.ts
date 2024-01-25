import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { randu } from '../../src/prng/randu';

const tsts = suite('randu');
tsts(`randu`, () => {
    /**
     * https://oeis.org/A096555
     * Consecutive internal states of the linear congruential pseudo-random number generator 
     * RANDU that was used in the IBM Scientific Subroutine Library for IBM System/360 
     * computers in the 1970's. 
     */
	const r = randu(1);
	assert.equal(r(), 65539);
	assert.equal(r(), 393225);
	assert.equal(r(), 1769499);
	assert.equal(r(), 7077969);
	assert.equal(r(), 26542323);
	assert.equal(r(), 95552217);
	assert.equal(r(), 334432395);
	assert.equal(r(), 1146624417);
	assert.equal(r(), 1722371299);
	assert.equal(r(), 14608041);
	assert.equal(r(), 1766175739);
	assert.equal(r(), 1875647473);
	assert.equal(r(), 1800754131);
	assert.equal(r(), 366148473);
	assert.equal(r(), 1022489195);
	assert.equal(r(), 692115265);
	assert.equal(r(), 1392739779);
	assert.equal(r(), 2127401289);
	assert.equal(r(), 229749723);
	assert.equal(r(), 1559239569);
});
tsts.run();
