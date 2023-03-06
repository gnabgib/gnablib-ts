/*! Copyright 2023 gnabgib MPL-2.0 */

import { bnf, IBnfRepeat, IBnf } from "./bnf.js";

//Augmented Backus-Naur Form
//https://datatracker.ietf.org/doc/html/rfc5234


// -- -- -- -- -- -- -- BNF Rules -- -- -- -- -- -- --

const ruleAlpha = new bnf.Alt(new bnf.Range('a', 'z'), new bnf.Range('A', 'Z'));
ruleAlpha.name='ALPHA';
ruleAlpha.suppressComponents=true;

const ruleBit = new bnf.Alt(new bnf.Char('0'), new bnf.Char('1'));
ruleBit.name='BIT';

const ruleAsciiChar = new bnf.Range(1, 0x7f,'CHAR');
const ruleCr = new bnf.Char('\r',undefined,'CR');
const ruleCrLf = new bnf.String('\r\n',undefined,'CRLF');
const ruleCtrlChar = new bnf.Range(0, '\x1F','CTL');
const ruleDigit = new bnf.Range('0', '9','DIGIT');
const ruleDoubleQuote = new bnf.Char('"',undefined,'DQUOTE');

const ruleHexDig = new bnf.Alt(ruleDigit, new bnf.Range('A', 'F')); //note wikipedia is wrong
ruleHexDig.name='HEXDIG';

const ruleHTab = new bnf.Char('\t',undefined,'HTAB');
const ruleLinefeed = new bnf.Char('\n',undefined,'LF');
const ruleOctet = new bnf.Range(0, 0xff,'OCTET');
const ruleSpace = new bnf.Char(' ',undefined,'SP');

const ruleVisibleChar = new bnf.Range('!', '~','VCHAR'); //x21-x7E
const ruleWhiteSpace = new bnf.Alt(ruleSpace, ruleHTab);
ruleWhiteSpace.name='WSP';

const ruleLinearWhiteSpace = bnf.Repeat.ZeroPlus(new bnf.Alt(ruleWhiteSpace, new bnf.Concat(ruleCrLf, ruleWhiteSpace)),'LWSP');

const rule2Digit=bnf.Repeat.Exactly(2,ruleDigit);
//rule2Digit.name='2DIGIT';

const ruleDecimalOctet=new bnf.Alt(
    //Note these have to be longest->shortest since all rules match digit
    //@@TODO: Automate the order on alt build
    /*250-255*/new bnf.Concat(new bnf.Char('2',undefined,'DIGIT'),new bnf.Char('5',undefined,'DIGIT'),new bnf.Range('0','5','DIGIT')),
    /*200-249*/new bnf.Concat(new bnf.Char('2',undefined,'DIGIT'),new bnf.Range('0','4','DIGIT'),ruleDigit),
    /*100-199*/new bnf.Concat(new bnf.Char('1',undefined,'DIGIT'),rule2Digit),
    /* 10- 99*/new bnf.Concat(new bnf.Range('1','9','DIGIT'),ruleDigit),
    /*  0-  9*/ruleDigit,
    );
ruleDecimalOctet.name='DECIMAL_OCTET';
ruleDecimalOctet.suppressComponents=true;

const ruleDot=new bnf.Char('.');

const ruleEmpty=bnf.Repeat.Exactly(0,ruleDot);//Rule doesn't matter
ruleEmpty.name='EMPTY';

const ruleIpv4=new bnf.Concat(ruleDecimalOctet,ruleDot,ruleDecimalOctet,ruleDot,ruleDecimalOctet,ruleDot,ruleDecimalOctet);
ruleIpv4.name='IPv4_ADDRESS';

const alphaNum=new bnf.Alt(ruleAlpha,ruleDigit);

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
    ALPHANUM:alphaNum,
    DOT:ruleDot,
    /**
     * The void, nothingness
     */
    EMPTY:ruleEmpty,
    /**
     * aka 2DIGIT (JS doesn't allow starting with number)
     */
    DIGIT_2:rule2Digit,
    /**
     * String representation of OCTET
     */
    DECIMAL_OCTET:ruleDecimalOctet,
    /**
     * String representation of IPv4 address
     */
    IPv4_ADDRESS:ruleIpv4,
};
