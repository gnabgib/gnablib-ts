/*! Copyright 2023 gnabgib MPL-2.0 */

import {
	BnfAlt,
	BnfChar,
	BnfConcat,
	BnfRange,
	BnfRepeat,
	BnfString,
	IBnf,
	IBnfRepeat,
} from './bnf.js';

//Augmented Backus-Naur Form
//https://datatracker.ietf.org/doc/html/rfc5234

// -- -- -- -- -- -- -- BNF Rules -- -- -- -- -- -- --

const ruleAlpha = new BnfAlt(new BnfRange('a', 'z'), new BnfRange('A', 'Z'));
ruleAlpha.name = 'ALPHA';
ruleAlpha.suppressComponents = true;

const ruleBit = new BnfAlt(new BnfChar('0'), new BnfChar('1'));
ruleBit.name = 'BIT';

const ruleAsciiChar = new BnfRange(1, 0x7f, 'CHAR');
const ruleCr = new BnfChar('\r', undefined, 'CR');
const ruleCrLf = new BnfString('\r\n', undefined, 'CRLF');
const ruleCtrlChar = new BnfRange(0, '\x1F', 'CTL');
const ruleDigit = new BnfRange('0', '9', 'DIGIT');
const ruleDoubleQuote = new BnfChar('"', undefined, 'DQUOTE');

const ruleHexDig = new BnfAlt(ruleDigit, new BnfRange('A', 'F')); //note wikipedia is wrong
ruleHexDig.name = 'HEXDIG';

const ruleHTab = new BnfChar('\t', undefined, 'HTAB');
const ruleLinefeed = new BnfChar('\n', undefined, 'LF');
const ruleOctet = new BnfRange(0, 0xff, 'OCTET');
const ruleSpace = new BnfChar(' ', undefined, 'SP');

const ruleVisibleChar = new BnfRange('!', '~', 'VCHAR'); //x21-x7E
const ruleWhiteSpace = new BnfAlt(ruleSpace, ruleHTab);
ruleWhiteSpace.name = 'WSP';

const ruleLinearWhiteSpace = BnfRepeat.ZeroPlus(
	new BnfAlt(ruleWhiteSpace, new BnfConcat(ruleCrLf, ruleWhiteSpace)),
	'LWSP'
);

const rule2Digit = BnfRepeat.Exactly(2, ruleDigit);
//rule2Digit.name='2DIGIT';

const ruleDecimalOctet = new BnfAlt(
	//Note these have to be longest->shortest since all rules match digit
	//@@TODO: Automate the order on alt build
	/*250-255*/ new BnfConcat(
		new BnfChar('2', undefined, 'DIGIT'),
		new BnfChar('5', undefined, 'DIGIT'),
		new BnfRange('0', '5', 'DIGIT')
	),
	/*200-249*/ new BnfConcat(
		new BnfChar('2', undefined, 'DIGIT'),
		new BnfRange('0', '4', 'DIGIT'),
		ruleDigit
	),
	/*100-199*/ new BnfConcat(new BnfChar('1', undefined, 'DIGIT'), rule2Digit),
	/* 10- 99*/ new BnfConcat(new BnfRange('1', '9', 'DIGIT'), ruleDigit),
	/*  0-  9*/ ruleDigit
);
ruleDecimalOctet.name = 'DECIMAL_OCTET';
ruleDecimalOctet.suppressComponents = true;

const ruleDot = new BnfChar('.');

const ruleEmpty = BnfRepeat.Exactly(0, ruleDot); //Rule doesn't matter
ruleEmpty.name = 'EMPTY';

const ruleIpv4 = new BnfConcat(
	ruleDecimalOctet,
	ruleDot,
	ruleDecimalOctet,
	ruleDot,
	ruleDecimalOctet,
	ruleDot,
	ruleDecimalOctet
);
ruleIpv4.name = 'IPv4_ADDRESS';

const alphaNum = new BnfAlt(ruleAlpha, ruleDigit);

//https://datatracker.ietf.org/doc/html/rfc5234
// names are case=insensitive
export const rules: Record<string, IBnf | IBnfRepeat> = {
	// -- -- -- CORE RULES -- -- --
	/**
	 * A-Z / a-z
	 */
	ALPHA: ruleAlpha,
	/**
	 * "0" / "1"
	 */
	BIT: ruleBit,
	/**
	 * Any 7 bit ASCII character, excluding NUL
	 */
	CHAR: ruleAsciiChar,
	/**
	 * Carriage return
	 */
	CR: ruleCr,
	/**
	 * Windows, internet standard newline
	 */
	CRLF: ruleCrLf,
	/**
	 * Control characters (non-printing)
	 */
	CTL: ruleCtrlChar,
	/**
	 * 0-9
	 */
	DIGIT: ruleDigit,
	/**
	 * Double quote (")
	 */
	DQUOTE: ruleDoubleQuote,
	/**
	 * 0-9 / A-F
	 */
	HEXDIG: ruleHexDig,
	/**
	 * Horizontal tab (\t)
	 */
	HTAB: ruleHTab,
	/**
	 * Line feed, linux newline (\n)
	 */
	LF: ruleLinefeed,
	/**
	 * Byte / 8 bits of data
	 */
	OCTET: ruleOctet,
	/**
	 * Space
	 */
	SP: ruleSpace,
	/**
	 * Visible (printing) characters
	 */
	VCHAR: ruleVisibleChar,
	/**
	 * White space
	 */
	WSP: ruleWhiteSpace,
	/**
	 * Linear white space
	 */
	LWSP: ruleLinearWhiteSpace,
	// -- -- -- Other common rules -- -- --
	/**
	 * Alpha numeric characters (a-ZA-Z0-9)
	 */
	ALPHANUM: alphaNum,
	DOT: ruleDot,
	/**
	 * The void, nothingness
	 */
	EMPTY: ruleEmpty,
	/**
	 * aka 2DIGIT (JS doesn't allow starting with number)
	 */
	DIGIT_2: rule2Digit,
	/**
	 * String representation of OCTET
	 */
	DECIMAL_OCTET: ruleDecimalOctet,
	/**
	 * String representation of IPv4 address
	 */
	IPv4_ADDRESS: ruleIpv4,
};
