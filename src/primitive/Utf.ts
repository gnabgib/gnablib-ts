/*! Copyright 2023 gnabgib MPL-2.0 */

/**
 * Whether a charCode, or character (first of string) is a line break
 * @param ord
 * @returns
 */
export function lineBreak(ord: number | string): boolean {
	if (typeof ord === 'string') {
		ord = ord.charCodeAt(0);
	}
	switch (ord) {
		case 10: //line-feed
		case 11: //line-tabulation
		case 12: //form-feed
		case 13: //carriage return
		case 0x85: //next-line (133)
		case 0x2028: //line-separator (8232)
		case 0x2029: //paragraph-separator (8233)
			return true;
	}
	return false;
}

/**
 * Whether a charCode, or character (first of string) is whitespace (includes line break)
 * @param ord
 * @returns
 */
export function whiteSpace(ord: number | string): boolean {
	if (typeof ord === 'string') {
		ord = ord.charCodeAt(0);
	}
	//We dup linebreak here
	switch (ord) {
		case 9: //Horizontal tab
		case 10: //----------lb-- line-feed
		case 11: //----------lb-- line-tabulation
		case 12: //----------lb-- form-feed
		case 13: //----------lb-- carriage return
		case 32: //Space
		case 0x85: //--------lb-- next-line (133)
		case 0xa0: //non-breaking space (nbsp 160)
		case 0x1680: //ogham space mark (5760)
		case 0x2000: //en quad (8192)
		case 0x2001: //em quad (8193)
		case 0x2002: //en space (8194)
		case 0x2003: //em space (8195)
		case 0x2004: //three-per-em space (8196)
		case 0x2005: //four-per-em space (8197)
		case 0x2006: //six-per-em space (8198)
		case 0x2007: //figure space (8199)
		case 0x2008: //punctuation space (8200)
		case 0x2009: //thin space (8201)
		case 0x200a: //hair space (8202)
		case 0x2028: //------lb-- line-separator (8232)
		case 0x2029: //------lb-- paragraph-separator (8233)
		case 0x202f: //narrow no-break space (8239)
		case 0x205f: //medium mathematical space (8287)
		case 0x3000: //ideographic space (12288)
			return true;
	}
	return false;
}

/**
 * Whether a charCode, or character (first of string) is printable
 * @param ord
 * @returns
 */
export function printable(ord: number | string): boolean {
	if (typeof ord === 'string') {
		ord = ord.charCodeAt(0);
	}
	//C0
	//ASCII iso646
	//x0-1F
	if (ord < 32) return false;
	if (ord < 127) return true;
	//Extended Latin iso 6429/ecma-48
	// x7f = C0
	// x80-x9F =C1
	if (ord < 159) return false;

	//Unicode
	switch (ord) {
		// Unicode separators
		case 0x2028: //  line separator
		case 0x2029: // paragraph separator
			return false;
		// Interlinear annotation
		case 0xfff9: // interlinear annotation anchor
		case 0xfffa: // interlinear annotation separator
		case 0xfffb: // interlinear annotation terminator
			return false;
		// Bidirectional text control
		case 0x061c: // Arabic letter mark
		case 0x200e: // left-to-right mark
		case 0x200f: // right-to-left mark
		case 0x202a: // left-to-right embedding
		case 0x202b: // right-to-left embedding
		case 0x202c: // pop directional formatting
		case 0x202d: // left-to-right override
		case 0x202e: // right-to-left override
		case 0x2066: // left-to-right isolate
		case 0x2067: // right-to-left isolate
		case 0x2068: // first strong isolate
		case 0x2069: // pop directional isolate
			return false;
	}
	return true;
	//https://en.wikipedia.org/wiki/Unicode_control_characters
	//https://en.wikipedia.org/wiki/Whitespace_character
}

/**
 * Whether a charCode, or character (first of string) can be cased
 * @param ord
 * @returns 
 */
export function asciiCased(ord: number | string): boolean {
	if (typeof ord === 'string') {
		ord = ord.charCodeAt(0);
	}
	if (ord < 65) return false;
	if (ord <= 90) return true;
	if (ord < 97) return false;
	if (ord <= 122) return true;
	return false;
}
