import { hex } from '../encoding/Hex.js';

export type errorSetting = {
	percent?: number;
	amount?: number;
};

// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// function errStr(s: errorSetting): string {
// 	const ret = [];
// 	if (s.percent) {
// 		ret.push(`±${s.percent}%`);
// 	}
// 	if (s.amount) {
// 		ret.push(`±${s.amount}`);
// 	}
// 	return ret.join(', ');
// }

export class Assert {
	/**
	 * Throw an exception if @see found is outside of [@see lowInc - @see highExc)
	 * @throws Error
	 */
	static inClosedOpen(actual: number, lowInc: number, highExc: number): void {
		if (actual >= lowInc && actual < highExc) return;
		throw new Error(
			`Number '${actual}' not in range (${lowInc} <= n < ${highExc})`
		);
	}

	/**
	 * Confirm `found` is within `error` of `expect`
	 * @throws Error
	 */
	static equalish(
		found: number,
		expect: number,
		error: errorSetting,
		name = 'Number'
	): void {
		let low = expect;
		let lowType = 'expect';
		let high = expect;
		let highType = 'expect';

		if (error.amount) {
			const altLow = expect - error.amount;
			const altHigh = expect + error.amount;
			const type = 'amt';
			if (altLow < low) {
				low = altLow;
				lowType = type;
			}
			if (altHigh > high) {
				high = altHigh;
				highType = type;
			}
		}
		if (error.percent) {
			const lowPc = 1 - (error.percent / 100);
			const highPc = 1 + (error.percent / 100);
			const altLow = expect * lowPc;
			const altHigh = expect * highPc;
			const type = '%';
			if (altLow < low) {
				low = altLow;
				lowType = type;
			}
			if (altHigh > high) {
				high = altHigh;
				highType = type;
			}
		}
		const away = Math.abs(found - expect);
		const awayPc = (away / expect) * 100;
		if (found >= low && found <= high) {
			//console.log(`${low} (${lowType}) <= ${found} <= ${high} (${highType}), e=${expect} / d=${away} / ${awayPc}% / ${errStr(error)}`)
			return;
		}
		throw new Error(
			`${name} '${found}' not in range (${low} (${lowType}) <= ${expect} <= ${high} (${highType})) ${away}/${awayPc}% off`
		);
	}

	static bytesMatchHex(actual: Uint8Array, expectHex: string): void {
		const found = hex.fromBytes(actual);
		if (found === expectHex) return;
		throw new Error(`Expect: ${expectHex}\n    Found : ${found}`);
	}
}