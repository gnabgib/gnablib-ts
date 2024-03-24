import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { superSafe } from '../../src/safe';
import { ILengther } from '../../src/primitive/interfaces/ILengther';

const tsts = suite('superSafe.len');

const lengthAtLeast: [ILengther, number, boolean][] = [
	//Anything that gives us a length element
	[new Uint8Array(0), 0, true],
	[new Uint8Array(0), 1, false],
	[new Uint8Array(10), 1, true],
	['', 1, false],
	['a', 1, true],
	['abba', 1, true],
];
for (const [test, need, expect] of lengthAtLeast) {
    tsts(`atLeast(${test},${need})`, () => {
        if (expect) {
            assert.not.throws(()=>superSafe.len.atLeast('$noun',test,need));
        } else {
            assert.throws(()=>superSafe.len.atLeast('$noun',test,need));
        }
    });	
}

tsts.run();