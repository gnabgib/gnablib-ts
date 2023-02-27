/*! Copyright 2023 gnabgib MPL-2.0 */

import { bnf, IBnfRepeat, IBnfRepeatable } from "./bnf.js";

//Augmented Backus-Naur Form
//https://datatracker.ietf.org/doc/html/rfc5234


// -- -- -- -- -- -- -- BNF Rules -- -- -- -- -- -- --

const ruleAlpha = new bnf.Alt(new bnf.Range('a', 'z'), new bnf.Range('A', 'Z'));
const ruleBit = new bnf.Alt(new bnf.Char('0'), new bnf.Char('1'));
const ruleAsciiChar = new bnf.Range(1, 0x7f);
const ruleCarriageReturn = new bnf.Char('\r');
const ruleCrLf = new bnf.String('\r\n');
const ruleCtrlChar = new bnf.Range(0, '\x1F');
const ruleDigit = new bnf.Range('0', '9');
const ruleDoubleQuote = new bnf.Char('"');
const ruleHexDig = new bnf.Alt(ruleDigit, new bnf.Range('A', 'F')); //note wikipedia is wrong
const ruleHorizontalTab = new bnf.Char('\t');
const ruleLinefeed = new bnf.Char('\n');
const ruleOctet = new bnf.Range(0, 0xff);
const ruleSpace = new bnf.Char(' ');
const ruleVisibleChar = new bnf.Range('!', '~'); //x21-x7E
const ruleWhiteSpace = new bnf.Alt(ruleSpace, ruleHorizontalTab);
const ruleLinearWhiteSpace = new bnf.Repeat(
	new bnf.Alt(ruleWhiteSpace, new bnf.Concat(ruleCrLf, ruleWhiteSpace))
);

//https://datatracker.ietf.org/doc/html/rfc5234
// names are case=insensitive
export const rules: Record<string, IBnfRepeatable | IBnfRepeat> = {
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
	CR: ruleCarriageReturn,
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
	HTAB: ruleHorizontalTab,
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
};
