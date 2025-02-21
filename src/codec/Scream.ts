/*! Copyright 2025 the gnablib contributors MPL-1.1 */

/*
a  a A
b  ȧ Ȧ	775
.c ̧a ̧A	807 |~808
.d ̱a ̱A	817 | 800 818
e  á Á	769
.f ̮a ̮A	814
.g ̋a ̋A	779
.h ̰a ̰A	816
i  ả Ả	777
.j ̓a ̓A	787
k  ạ Ạ	803
l  ă Ă	774
m  ǎ Ǎ	780
n  ȃ Ȃ	770
o  å Å	778
.p ̯a ̯A	815 | 813
.q ̤a ̤A	804
r  â Â	785
s  ã Ã	771
t  ā Ā	772
u  ä Ä	776
v  à À	768
w  ȁ Ȁ	783
.x ̽a ̽A	829
.y ̦a ̦A	806
<z ̸a Ⱥ	824 | 823
*/

//Single character versions vs [aA]+dia
// prettier-ignore
const wholeChrs: Record<string, string> = {
	ȧ: 'b', Ȧ: 'B',
	á: 'e', Á: 'E',
	ả: 'i', Ả: 'I',
	ạ: 'k', Ạ: 'K',
	ă: 'l', Ă: 'L',
	ǎ: 'm', Ǎ: 'M',
	ȃ: 'n', Ȃ: 'N',
	å: 'o', Å: 'O',
	â: 'r', Â: 'R',
	ã: 's', Ã: 'S',
	ā: 't', Ā: 'T',
	ä: 'u', Ä: 'U',
	à: 'v', À: 'V',
	ȁ: 'w', Ȁ: 'W',
	Ⱥ: 'Z', //There's no lower case ver of this
};

// Dia table, with best-guess of what XKCD was going for
// prettier-ignore
const diaTbl = [
	0, 775, 807, 817, 769, 814, 779, 816, 777, 787, 803, 774, 780, 
    770, 778, 815, 804, 785, 771, 772, 776, 768, 783, 829, 806, 824,
];

/**
 * Convert ASCII (hopefully) to scream-cipher text, since XKCD only defines
 * uppercase letter encoding we:
 *
 * - Assume lower case letter encoding uses the same diacritic on a lowercase "a"
 * - Assume all other characters in the stream should be left alone
 * - We use whole characters whenever they exist, over diacritic+char
 * - If the input includes diacritic-A or extended A characters.. the result will be ambiguous!
 *
 * @param text
 */
export function encode(text: string): string {
	let ret = '';
	for (const chr of text) {
		const ord = chr.codePointAt(0)!;
		if (ord > 65 && ord < 91) {
			//B-Z
			ret += 'A' + String.fromCodePoint(diaTbl[ord - 65]);
		} else if (ord > 97 && ord < 123) {
			//b-z
			ret += 'a' + String.fromCodePoint(diaTbl[ord - 97]);
		} else ret += chr;
		// if (i==undefined || i<66 || i>122) ret+=c;
		// else /*A-z in ascii (i>64 && i<123)*/ ret+=tbl[i-66];
	}
	return ret;
}

/**
 * Convert scream-cipher text back into ASCII.
 *
 * - Some whole characters (rather than diacritic+char) will also be correctly decoded
 * - If the input includes other diacritic letters, they'll survive
 * - If the encoded text included diacritic-a letters that are used in the encoding we'll incorrectly
 *  decode them, there's no escaping so what can we do?
 *
 * @param text
 * @returns
 */
export function decode(text: string): string {
	let ret = '';
	let last: number = 0;
	for (const chr of text) {
		const ord = chr.codePointAt(0)!; //Cannot be undefined (out of range)

		//Are we in the diacritics?
		if (ord >= 768 && ord < 879) {
			//Diacritics go after a letter to mod
			//x300 - x36F which means they're encoded as 2 bytes: 110xxxyy 10yyzzzz
			// = 110011yy 10yyzzzz = xC[C-F] x[8-B][0-F]

			if (last) {
				const di = diaTbl.indexOf(ord);
				if (di >= 0) {
					//Valid di
					ret += String.fromCodePoint(last + di);
					last = 0;
					continue;
				}
				//It's an a/A with an unknown dia
				ret += String.fromCodePoint(last) + chr;
				last = 0;
				continue;
			}
			//It's a dia but not on an a/A
			ret += chr;
			continue;
		}
		//Catch a last that wasn't consumed by a dia and append it now
		if (last) {
			ret += String.fromCodePoint(last);
			last = 0;
		}
		if (ord == 97 || ord == 65) {
			//'a'||'A'
			last = ord;
			continue;
		}
		if (chr in wholeChrs) {
			ret += wholeChrs[chr];
		} else ret += chr;
	}
	//Catch a trailing a/A
	if (last) ret += String.fromCodePoint(last);
	return ret;
}
