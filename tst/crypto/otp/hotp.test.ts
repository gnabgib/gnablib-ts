import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Hotp } from '../../../src/crypto/otp';
import { utf8 } from '../../../src/codec';
import { ParseProblem } from '../../../src/error';
import { U64 } from '../../../src/primitive/number/U64';

const tsts = suite('HOTP/RFC 4226');

//Test vectors from the RFC
const appendixD: [number, number][] = [
	[0, 755224],
	[1, 287082],
	[2, 359152],
	[3, 969429],
	[4, 338314],
	[5, 254676],
	[6, 287922],
	[7, 162583],
	[8, 399871],
	[9, 520489],
];

// utf8 = 12345678901234567890
// bytes = x3132333435363738393031323334353637383930
//https://hexcalculator.org/hex-to-base32/
// u32 = GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ

const appDKey = utf8.toBytes('12345678901234567890');
const appDHotp = Hotp.newWithKey(appDKey);
for (const [c, expect] of appendixD) {
	tsts(`HOTP(${c})`, () => {
		assert.is(appDHotp.generate(), expect);
		appDHotp.consume();
	});
}

const validate2Tests: [number, number, number, boolean, number][] = [
	//0 0
	[287082, 0, 0, false, 2],
	[359152, 0, 0, true, 2],
	[969429, 0, 0, false, 2],
	//-1 +1
	[755224, 1, 1, false, 2],
	[287082, 1, 1, true, 1],
	[359152, 1, 1, true, 2],
	[969429, 1, 1, true, 3],
	[338314, 1, 1, false, 2],
	//-2 +1
	[755224, 2, 1, true, 0],
	[287082, 2, 1, true, 1],
	[359152, 2, 1, true, 2],
	[969429, 2, 1, true, 3],
	[338314, 2, 1, false, 2],
];
for (const [tok, back, fwd, expect, finalC] of validate2Tests) {
	tsts(`HOTP(2).validate(${tok},${back},${fwd})=${expect}`, () => {
		const h = Hotp.newWithKey(appDKey, undefined, undefined, U64.fromI32s(2));
		assert.equal(h.validate(tok, back, fwd), expect);
		//Make sure the counter reflects the found window
		assert.equal(h.counter.eq(U64.fromI32s(finalC)), true, `counter=${finalC}`);
	});
}

const createUriTests: [string, string, string][] = [
	['a', 'b', 'otpauth://hotp/a:b?secret=k&counter=0'],
	['a', 'b?', 'otpauth://hotp/a:b%3F?secret=k&counter=0'],
];
for (const [iss, user, expect] of createUriTests) {
	tsts(`HOTP().createUri(${iss},${user})`, () => {
		const h = Hotp.newWithKey(appDKey);
		assert.is(h.createUri(iss, user, 'k'), expect);
	});
}

const badCreateUriTests: [string, string][] = [
	//Not allowed : in issuer
	['i:', 'u'],
	//Not allowed : in user
	['i', 'u:'],
];
for (const [iss, user] of badCreateUriTests) {
	tsts(`HOTP().createUri(${iss},${user}) throws`, () => {
		assert.throws(() => appDHotp.createUri(iss, user, 'k'));
	});
}

const parseTests: [string, string, string, string][] = [
	//From google eg (althouh hotp)
	[
		'otpauth://hotp/Example:alice@google.com?secret=JBSWY3DPEHPK3PXP&issuer=Example',
		'otpauth://hotp/i:u?secret=k&counter=0',
		'Example',
		'alice@google.com',
	],
	//Opt digits
	[
		'otpauth://hotp/alice@google.com?secret=JBSWY3DPEHPK3PXP&issuer=Example&digits=7',
		'otpauth://hotp/i:u?secret=k&digits=7&counter=0',
		'',
		'alice@google.com',
	],
	//Opt counter
	[
		'otpauth://hotp/a:b?secret=JBSWY3DPEHPK3PXP&counter=3',
		'otpauth://hotp/i:u?secret=k&counter=3',
		'a',
		'b',
	],
	//Opt algorithms
	[
		'otpauth://hotp/a:b?secret=JBSWY3DPEHPK3PXP&algorithm=SHA1',
		'otpauth://hotp/i:u?secret=k&counter=0',
		'a',
		'b',
	],
	[
		'otpauth://hotp/a:b?secret=JBSWY3DPEHPK3PXP&algorithm=SHA256',
		'otpauth://hotp/i:u?secret=k&algorithm=SHA256&counter=0',
		'a',
		'b',
	],
	[
		'otpauth://hotp/a:b?secret=JBSWY3DPEHPK3PXP&algorithm=SHA512',
		'otpauth://hotp/i:u?secret=k&algorithm=SHA512&counter=0',
		'a',
		'b',
	],
	//Param order isn't important
	[
		'otpauth://hotp/a:b?algorithm=SHA256&secret=JBSWY3DPEHPK3PXP',
		'otpauth://hotp/i:u?secret=k&algorithm=SHA256&counter=0',
		'a',
		'b',
	],
	//Period, even though not used, doesn't mess anything up
	[
		'otpauth://hotp/a:b?secret=JBSWY3DPEHPK3PXP&period=11',
		'otpauth://hotp/i:u?secret=k&counter=0',
		'a',
		'b',
	],
];
for (const [uri, expectUri, expectIss, expectUser] of parseTests) {
	tsts(`HOTP.parseUri(${uri})`, () => {
		const r = Hotp.parseUri(uri);
		if (Array.isArray(r)) {
			assert.instance(r[0], Hotp);
			assert.is(r[0].createUri('i', 'u', 'k'), expectUri);
			assert.is(r[1], expectIss);
			assert.is(r[2], expectUser);
		} else assert.equal(false,true,'Expecting an array result');
	});
}
const badParseTests: string[] = [
	//Fails - TOTP type
	'otpauth://totp/Example:alice@google.com?secret=JBSWY3DPEHPK3PXP&issuer=Example',
	//Fails - not a otpauth URI
	'https://github.com/google/google-authenticator/wiki/Key-Uri-Format',
	//Fails - no secret
	'otpauth://hotp/Example:alice@google.com?secret=',
	'otpauth://hotp/Example:alice@google.com?',
	'otpauth://hotp/Example:alice@google.com',
	//Fails - unknown algo
	'otpauth://hotp/Example:alice@google.com?secret=JBSWY3DPEHPK3PXP&algorithm=MD5',
];
for (const uri of badParseTests) {
	tsts(`HOTP.parseUri(${uri}) fails`, () => {
		const r = Hotp.parseUri(uri);
		assert.instance(r, ParseProblem);
		//console.log(r);
	});
}

const keyTests: [number | undefined, number][] = [
	[4, 4],
	[undefined, 16],
	[20, 20],
];
for (const [size, expect] of keyTests) {
	tsts(`HOTP.newRandomKey(${size})`, () => {
		const k = Hotp.randomKey(size);
		assert.equal(k.length, expect);
	});
}
tsts(`HOTP.newRandomKey(2) throws`, () => {
	assert.throws(() => Hotp.randomKey(2));
});

tsts.run();
