import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Month, DateOnly } from '../../src/datetime/dt';

const tsts = suite('DateOnly.vslow');

//Moved to vslow - this test is through and passes, but we really don't need it on every checkin
// (which is the frequency of deep, if not manually invoked)

//Takes Duration:  300512.97ms - Passed:    11968486
// Passed:    11968886 Duration:  297084.50ms - optimize for less object builds (dim takes ints)
// Passed:    11968886 Duration:  296543.34ms - optimize for less allocations (use same storage block)
// Passed:    393836 Duration:  32742.08ms - output to screen is taking time, only one "test" per month (still asserts)
// Passed:    33388 Duration:  23810.01ms - ", only one "test" per year (still asserts)
// Passed:    621 Duration:  24966.43ms - " only one "test" for every day (still asserts)
// -> looks like 1/year is a nice speed:output balance

let expDep = -4371953;
for (let y = -10000; y <= 22767; y++) {
    tsts(`days(${expDep})`, () => {
        for (let m = 1; m <= 12; m++) {
            const dim = Month.lastDay(m,y);
            for (let d = 1; d <= dim; d++) {
                const dep = DateOnly.new(y, m, d).toUnixDays();
                assert.is(dep, expDep);
                expDep = dep + 1;
            }
        }
    });
}

tsts.run();
