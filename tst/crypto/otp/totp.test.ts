import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { base32, hex, utf8 } from '../../../src/codec';
import { Totp } from '../../../src/crypto/otp';
import { U64 } from '../../../src/primitive/number/U64';
import { Sha256, Sha512 } from '../../../src/crypto/hash/Sha2';
import { Sha1 } from '../../../src/crypto/hash/Sha1';
import { Blake256 } from '../../../src/crypto/hash/Blake1';
import { ParseProblem } from '../../../src/error/probs/ParseProblem';

const tsts = suite('TOTP/RFC 6238');

//Test vectors from the RFC
const appendixB_sha1: [U64, number][] = [
	[U64.fromInt(59), 94287082],
	[U64.fromInt(1111111109), 7081804], //07081804
	[U64.fromInt(1111111111), 14050471],
	[U64.fromInt(1234567890), 89005924],
	[U64.fromInt(2000000000), 69279037],
	//>2038 goes into 64bit
	[U64.fromBytesBE(hex.toBytes('00000004A817C800')), 65353130],
	//Although still fits in 52bit
	[U64.fromInt(20_000_000_000), 65353130], //This is representable in JS U52
];

const appBKeySha1 = utf8.toBytes('12345678901234567890');
const appBTotpSha1 = Totp.newWithKey(appBKeySha1, 30, 8);
for (const test of appendixB_sha1) {
	tsts(`TOTP-SHA1(${test[0]})`, () => {
		appBTotpSha1.setUtime(test[0]);
		assert.is(appBTotpSha1.generate(false), test[1]);
	});
}

const appendixB_sha256: [U64, number][] = [
	[U64.fromInt(59), 46119246],
	[U64.fromInt(1111111109), 68084774],
	[U64.fromInt(1111111111), 67062674],
	[U64.fromInt(1234567890), 91819424],
	[U64.fromInt(2000000000), 90698825],
	//Although still fits in 52bit
	[U64.fromInt(20_000_000_000), 77737706], //This is representable in JS U52
];
const appBKeySha256 = hex.toBytes(
	'3132333435363738393031323334353637383930' + '313233343536373839303132',
);
const appBTotpSha256 = Totp.newWithKey(appBKeySha256, 30, 8, new Sha256());
for (const test of appendixB_sha256) {
	tsts(`TOTP-SHA256(${test[0]})`, () => {
		appBTotpSha256.setUtime(test[0]);
		assert.is(appBTotpSha256.generate(false), test[1]);
	});
}

const appendixB_sha512: [U64, number][] = [
	[U64.fromInt(59), 90693936],
	[U64.fromInt(1111111109), 25091201],
	[U64.fromInt(1111111111), 99943326],
	[U64.fromInt(1234567890), 93441116],
	[U64.fromInt(2000000000), 38618901],
	//Although still fits in 52bit
	[U64.fromInt(20_000_000_000), 47863826], //This is representable in JS U52
];
const appBKeySha512 = hex.toBytes(
	'3132333435363738393031323334353637383930' +
		'3132333435363738393031323334353637383930' +
		'3132333435363738393031323334353637383930' +
		'31323334',
);
const appBTotpSha512 = Totp.newWithKey(appBKeySha512, 30, 8, new Sha512());
for (const test of appendixB_sha512) {
	tsts(`TOTP-SHA512(${test[0]})`, () => {
		appBTotpSha512.setUtime(test[0]);
		assert.is(appBTotpSha512.generate(false), test[1]);
	});
}

//Generated from an online Token Generator
//https://otpauth.molinero.dev/
//https://www.epochconverter.com/
//otpauth://totp/OTPAuth:Alice?issuer=OTPAuth&secret=JBSWY3DPEHPK3PXP&algorithm=SHA1&digits=6&period=30
const otherSha1: [U64, number][] = [
	[U64.fromInt(1782603192), 532939],
	[U64.fromInt(1782603307), 758280],
	[U64.fromInt(1782603341), 534189],
	[U64.fromInt(1782603375), 217866],
	[U64.fromInt(1782603387), 217866],
	[U64.fromInt(1782603405), 699559],
];
//https://github.com/google/google-authenticator/wiki/Key-Uri-Format
// Hello! = JBSWY3DPEHPK3PXP
const otherTotpSha1 = Totp.newWithKey(
	base32.toBytes('JBSWY3DPEHPK3PXP'),
	30,
	6,
);
for (const test of otherSha1) {
	tsts(`TOTP(${test[0]})`, () => {
		otherTotpSha1.setUtime(test[0]);
		assert.is(otherTotpSha1.generate(false), test[1]);
	});
}
//otpauth://totp/OTPAuth:Alice?issuer=OTPAuth&secret=SGJU33Q5PYK6DUGNO4BTTPXA52JWJQYO&algorithm=SHA1&digits=6&period=30
const otherSha1b: [U64, number][] = [
	[U64.fromInt(1782603556), 186786],
	[U64.fromInt(1782603575), 361637],
	[U64.fromInt(1782603606), 895260],
	[U64.fromInt(1782603635), 234355],
	[U64.fromInt(1782603669), 267593],
];
const otherTotpSha1b = Totp.newWithKey(
	base32.toBytes('SGJU33Q5PYK6DUGNO4BTTPXA52JWJQYO'),
	30,
	6,
);
for (const test of otherSha1b) {
	tsts(`TOTP(${test[0]})`, () => {
		otherTotpSha1b.setUtime(test[0]);
		assert.is(otherTotpSha1b.generate(false), test[1]);
	});
}

//This is impossible to test, so you'll have to live configure a website to do it (this secret is in the docs so.. burned)
tsts(`basic`, () => {
	otherTotpSha1.generate();
	//console.log(`${otherTotpSha1.generate()}`);
});

//These are somewhat brittle (parameter order assumed), but we need to check the URI cases
const createUriCases: [Totp, string, string, string, string][] = [
	//Digits <>6
	[appBTotpSha1, 'a', 'b', 'KEY', 'otpauth://totp/a:b?secret=KEY&digits=8'],
	[
		appBTotpSha1,
		'Snake Oil',
		'alice@example.com',
		'KY',
		'otpauth://totp/Snake%20Oil:alice@example.com?secret=KY&digits=8',
	],
	//Make sure a/b/key aren't hard coded :D
	[
		appBTotpSha1,
		'NIST',
		'u@example.com',
		'CR',
		'otpauth://totp/NIST:u@example.com?secret=CR&digits=8',
	],
	//Digits=6 so dropped
	[otherTotpSha1, 'a', 'b', 'KEY', 'otpauth://totp/a:b?secret=KEY'],
	//Make sure injecting SHA1 is the same as not specifying, notice the created-key and the URI key don't match
	[
		Totp.newWithKey(Uint8Array.of(1, 2, 3, 4), 30, 6, new Sha1()),
		'i',
		'u',
		'KY',
		'otpauth://totp/i:u?secret=KY',
	],
	//Check SHA256 algo
	[
		appBTotpSha256,
		'NIST',
		'u@example.com',
		'CR',
		'otpauth://totp/NIST:u@example.com?secret=CR&algorithm=SHA256&digits=8',
	],
	//Check SHA512 algo
	[
		appBTotpSha512,
		'NIST',
		'u@example.com',
		'CR',
		'otpauth://totp/NIST:u@example.com?secret=CR&algorithm=SHA512&digits=8',
	],
	//Make sure a strange time window is included
	[
		Totp.newWithKey(Uint8Array.of(0), 29),
		'i',
		'u',
		'KY',
		'otpauth://totp/i:u?secret=KY&period=29',
	],
	//NON-Standard, any hash algo with 20+ bytes will work
	[
		Totp.newWithKey(Uint8Array.of(0), 30, 6, new Blake256()),
		'NIST',
		'u@example.com',
		'CR',
		'otpauth://totp/NIST:u@example.com?secret=CR&algorithm=BLAKE-256',
	],
];
for (const [otp, iss, user, key, exp] of createUriCases) {
	tsts(`TOTP.createUri(${iss},${user},${key})`, () => {
		assert.is(otp.createUri(iss, user, key), exp);
	});
}

tsts(`TOTP.createUri('a','b',Uint8Array)`, () => {
	const key = base32.toBytes('ABBA');
	assert.is(
		appBTotpSha1.createUri('a', 'b', key),
		'otpauth://totp/a:b?secret=ABBA&digits=8',
	);
});

const parseTests: [string, string, string, string][] = [
	//From google eg (althouh hotp)
	[
		'otpauth://totp/Example:alice@google.com?secret=JBSWY3DPEHPK3PXP&issuer=Example',
		'otpauth://totp/i:u?secret=k',
		'Example',
		'alice@google.com',
	],
	[
		'otpauth://totp/Provider1:Alice%20Smith?secret=JBSWY3DPEHPK3PXP&issuer=Example',
		'otpauth://totp/i:u?secret=k',
		'Provider1',
		'Alice Smith',
	],
	[
		'otpauth://totp/Big%20Corporation%3A%20alice%40bigco.com?secret=JBSWY3DPEHPK3PXP&issuer=Example',
		'otpauth://totp/i:u?secret=k',
		'Big Corporation',
		'alice%40bigco.com',
	],
];
for (const [uri, expectUri, expectIss, expectUser] of parseTests) {
	tsts(`TOTP.parseUri(${uri})`, () => {
		const r = Totp.parseUri(uri);
		if (Array.isArray(r)) {
			assert.instance(r[0], Totp);
			assert.is(r[0].createUri('i', 'u', 'k'), expectUri);
			assert.is(r[1], expectIss);
			assert.is(r[2], expectUser);
		} else assert.equal(false, true, 'Expecting an array result');
	});
}
const badParseTests: string[] = [
	//Fails - HOTP type
	'otpauth://hotp/Example:alice@google.com?secret=JBSWY3DPEHPK3PXP&issuer=Example',
];
for (const uri of badParseTests) {
	tsts(`TOTP.parseUri(${uri}) fails`, () => {
		const r = Totp.parseUri(uri);
		assert.instance(r, ParseProblem);
		//console.log(r);
	});
}

const validate60Tests: [number, number, number, boolean, number][] = [
	// 0 0
	[287082, 0, 0, false, 2],
	[359152, 0, 0, true, 2],
	[969429, 0, 0, false, 2],
	//-2 +1
	[755224, 2, 1, true, 0],
	[287082, 2, 1, true, 1],
	[359152, 2, 1, true, 2],
	[969429, 2, 1, true, 3],
	[338314, 2, 1, false, 2],
];
const totpSha1 = Totp.newWithKey(appBKeySha1, 30, 6);
const t60 = U64.fromI32s(60);
for (const [tok, back, fwd, expect, finalC] of validate60Tests) {
	tsts(`TOTP().validate(${tok},${back},${fwd})=${expect}`, () => {
		totpSha1.setUtime(t60);
		assert.equal(totpSha1.validate(tok, back, fwd, false), expect);
		//Make sure the counter reflects the found window
		assert.equal(
			totpSha1.counter.eq(U64.fromI32s(finalC)),
			true,
			totpSha1.counter.toString(),
		);
	});
}

const validateTime359152Tests: [U64, number, number, boolean][] = [
	//0 0
	[U64.fromI32s(59), 0, 0, false],
	[U64.fromI32s(60), 0, 0, true],
	[U64.fromI32s(61), 0, 0, true],
	[U64.fromI32s(89), 0, 0, true],
	[U64.fromI32s(90), 0, 0, false],
	// -2 +1
	//359152 is valid from 60-89
	// +1 means the tiem can be as low as 30
	// -2 means the time can be has high as 149
	[U64.fromI32s(29), 2, 1, false],
	[U64.fromI32s(30), 2, 1, true],
	[U64.fromI32s(59), 2, 1, true],
	[U64.fromI32s(90), 2, 1, true],
	[U64.fromI32s(120), 2, 1, true],
	[U64.fromI32s(149), 2, 1, true],
	[U64.fromI32s(150), 2, 1, false],
];
for (const [time, back, fwd, expect] of validateTime359152Tests) {
	tsts(`TOTP(${time}).validate(359152,${back},${fwd})=${expect}`, () => {
		totpSha1.setUtime(time);
		assert.equal(totpSha1.validate(359152, back, fwd, false), expect);
	});
}

tsts.run();
