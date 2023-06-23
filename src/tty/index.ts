/*! Copyright 2023 gnabgib MPL-2.0 */

import { safety } from '../primitive/Safety.js';
import { stringExt } from '../primitive/StringExt.js';

//[ANSI escape code](https://en.wikipedia.org/wiki/ANSI_escape_code)
//[ECMA-48](https://www.ecma-international.org/publications-and-standards/standards/ecma-48/)
//[CHARACTER CONTENT ARCHITECTURES T.416](https://www.itu.int/rec/T-REC-T.416-199303-I/en)
//[Terminals that support colours](https://github.com/termstandard/colors)
// -xterm, alacritty, mosh, putty, mobaxterm, cmd, powershell, xterm.js, iTerm2

// COMPAT
// 1. powershell 6 (windows)
// 2. powershell 7 (current)
// 3. cmd.exe
// 4. alacritty (win)
// 5. vs code/embedded powershell (win) /w 
// 6. mobaXterm
//                 01 02 03 04 05 06 07
// Named Color     x  x  x  x1 x1
// Grey            x  x  x  x  x2
// 216 color       x  x  x  x  x3
// 24bit color     x  x  x  x  x3
// underline       x  x  x  x  x
// doubleUnder     x  x  x  x  x
// strikethrough   x  x  x  x  x
// overline        x  x  x  x  x
// bold            x  x  x  x  x4
// faint           x  x  x  x  x
// italic          x  x  x  x  x
// gothic
// blinkSlow       x  x  x
// blinkFast       x5 x5 x5
// invert          x  x  x  x  x
// hide            x  x  x  x  x
//
// x1 - Alacritty, VS Code tint the named colours (possibly because of background)
// x2 - VS code tints foreground greys so much they're basically useless (background is ok)
// x3 - VS code tints foreground colours, there's no black, hardly any red or blue, green and yellow are ok
// x4 - Bold in VS Code is hard to distinguish from regular
// x5 - Blink fast runs at the same speed as blink slow (so.. not useful)
// Gothic seems to have no support
// BlinkFast seems to have no support

//Other SGR commands (not embedded in StyleSets below)
// const primaryFont=10;
// const altFont1=11;
// const altFont2=12;
// const altFont3=13;
// const altFont4=14;
// const altFont5=15;
// const altFont6=16;
// const altFont7=17;
// const altFont8=18;
// const altFont9=19;
// const variable=26;//Variable/proportional spacing (no terminal support)
const fg_expand = 38;
const bg_expand = 48;
// const notVariable=50;
// const framed=51;
// const encircled=52;
// const notFramedCircled=54;

//Expanded color settings
//const color_transparent=1;
const color_rgb = 2;
//const color_cmy=3;
//const color_cmyk=4;
const color_index = 5;

/** Issue a Control Sequence Introducer (CSI) command  */
function csi(end: string, ns: Array<number>): string {
	//\033 (octal) \x1b (hex) or \e (bash only?) is the escape sequence for.. the escape char
	return `\x1b[${ns.join(';')}${end}`;
}

/** Issue a Select Graphic Rendition (SGR) command */
function sgr(num: number | Array<number>): string {
	if (typeof num == 'number') {
		return csi('m', [num]);
	} else if (num.length > 0) {
		return csi('m', num);
	}
	return '';
}

class StyleSet {
	protected constructor(readonly off: number, readonly on: number[] = []) {}

	/** Apply this style now (you'll have to undo yourself) */
	now(): string {
		return this.on.length > 0 ? sgr(this.on) : sgr(this.off);
	}
}
/** Terminal control commands */
export class Ctrl {
	protected constructor(readonly end: string, readonly by: number[]) {}

	/** Exec this control */
	exec(): string {
		return csi(this.end, this.by);
	}

	/** move cursor up `by` rows, 1 if not defined */
	static up(by?: number): Ctrl {
		return new Ctrl('A', by ? [by] : []);
	}
	/** move cursor down `by` row, 1 if not defined */
	static down(by?: number): Ctrl {
		return new Ctrl('B', by ? [by] : []);
	}
	/** move cursor right `by` columns, 1 if not defined */
	static right(by?: number): Ctrl {
		return new Ctrl('C', by ? [by] : []);
	}
	/** move cursor left `by` columns, 1 if not defined */
	static left(by?: number): Ctrl {
		return new Ctrl('D', by ? [by] : []);
	}
	/** move to row,col on screen, 1 based (1,1 is top-left) */
	static jump(row = 1, col = 1): Ctrl {
		return new Ctrl('H', [row, col]);
	}
	static get clearScreen_toEnd(): Ctrl {
		return new Ctrl('J', []);
	}
	static get clearScreen_toStart(): Ctrl {
		return new Ctrl('J', [1]);
	}
	static get clearScreen_all(): Ctrl {
		return new Ctrl('J', [2]);
	}
	static get clearScreen_allAndScroll(): Ctrl {
		return new Ctrl('J', [3]);
	}
	static get clearLine_toEnd(): Ctrl {
		return new Ctrl('K', []);
	}
	static get clearLine_toStart(): Ctrl {
		return new Ctrl('K', [1]);
	}
	static get clearLine_all(): Ctrl {
		return new Ctrl('K', [2]);
	}
	//static get report():CtrlSeq {return new CtrlSeq('n',[6]);}
	//static get saveCursor():CtrlSeq{return new CtrlSeq('s',[])}
	//static get restoreCursor():CtrlSeq{return new CtrlSeq('u',[])}
}

class StyleContext {
	#state: number[][] = [];

	/** Add a new style to the state */
	add(e: StyleSet): string {
		//use off as a namespace
		if (e.on.length == 0) {
			delete this.#state[e.off];
		} else {
			this.#state[e.off] = e.on;
		}
		return e.now();
	}

	/** Cleanup any styles opened in this context */
	cleanup(): string {
		const clears: number[] = [];
		for (const k in this.#state) clears.push(+k);
		return sgr(clears);
	}
}

/** Control whether text is single, double, or no line below (use with @see tty) */
export class Underline extends StyleSet {
	protected constructor(on?: number) {
		super(24, on ? [on] : undefined);
	}
	/** No line below */
	static get off(): Underline {
		return new Underline();
	}
	/** Single line below */
	static get single(): Underline {
		return new Underline(4);
	}
	/** Double line below */
	static get double(): Underline {
		return new Underline(21);
	}
}
/** Control whether text is bold, faint or regular (use with @see tty) */
export class Weight extends StyleSet {
	protected constructor(on?: number) {
		super(22, on ? [on] : undefined);
	}
	/** Regular weight */
	static get regular(): Weight {
		return new Weight();
	}
	/** Bold/increased intensity */
	static get bold(): Weight {
		return new Weight(1);
	}
	/** Faint, decreased intensity, or dim */
	static get faint(): Weight {
		return new Weight(2);
	}
}
/** Control whether text-letters are italic, gothic or regular (use with @see tty) */
export class LetterStyle extends StyleSet {
	protected constructor(on?: number) {
		super(23, on ? [on] : undefined);
	}
	/** Regular style */
	static get regular(): LetterStyle {
		return new LetterStyle();
	}
	/** Italic style */
	static get italic(): Weight {
		return new LetterStyle(3);
	}
	/** aka Fraktur (poor support) */
	static get gothic(): Weight {
		return new LetterStyle(20);
	}
}
/** Control whether text blinks slow, fast, or not (use with @see tty) */
export class Blink extends StyleSet {
	protected constructor(on?: number) {
		super(25, on ? [on] : undefined);
	}
	/** No blink */
	static get none(): Blink {
		return new Blink();
	}
	/** Slow blink (<150 per minute) */
	static get slow(): Blink {
		return new Blink(5);
	}
	/** Fast blink (150+ per minute) (poor support) */
	static get fast(): Blink {
		return new Blink(6);
	}
}
/** Control whether fore/back colors are inverted, or not (use with @see tty) */
export class Invert extends StyleSet {
	protected constructor(on?: number) {
		super(27, on ? [on] : undefined);
	}
	/** Normal colors */
	static get off(): Invert {
		return new Invert();
	}
	/** Invert colors */
	static get on(): Invert {
		return new Invert(7);
	}
}
/** Control whether text is hidden, or not (use with @see tty) */
export class Hide extends StyleSet {
	protected constructor(on?: number) {
		super(28, on ? [on] : undefined);
	}
	/** Show text */
	static get off(): Hide {
		return new Hide();
	}
	/** Hide text */
	static get on(): Hide {
		return new Hide(8);
	}
}
/** Control whether text is crossed-out, or not (use with @see tty) */
export class StrikeThrough extends StyleSet {
	protected constructor(on?: number) {
		super(29, on ? [on] : undefined);
	}
	/** Regular text */
	static get off(): StrikeThrough {
		return new StrikeThrough();
	}
	/** Strike through text */
	static get on(): StrikeThrough {
		return new StrikeThrough(9);
	}
}
/** Control whether text has a line above, or not (use with @see tty) */
export class Overline extends StyleSet {
	protected constructor(on?: number) {
		super(55, on ? [on] : undefined);
	}
	/** No line above */
	static get off(): Overline {
		return new Overline();
	}
	/** Line above */
	static get on(): Overline {
		return new Overline(53);
	}
}
/** Control foreground color of text (use with @see tty) */
export class Color extends StyleSet {
	protected constructor(on?: number[]) {
		super(39, on);
	}
	/** Default foreground color (clear any foreground color settings) */
	static get default(): Color {
		return new Color();
	}
	/** Set foreground color to black */
	static get black(): Color {
		return new Color([30]);
	}
	/** Set foreground color to red */
	static get red(): Color {
		return new Color([31]);
	}
	/** Set foreground color to green */
	static get green(): Color {
		return new Color([32]);
	}
	/** Set foreground color to yellow */
	static get yellow(): Color {
		return new Color([33]);
	}
	/** Set foreground color to blue */
	static get blue(): Color {
		return new Color([34]);
	}
	/** Set foreground color to magenta */
	static get magenta(): Color {
		return new Color([35]);
	}
	/** Set foreground color to cyan */
	static get cyan(): Color {
		return new Color([36]);
	}
	/** Set foreground color to white */
	static get white(): Color {
		return new Color([37]);
	}
	/**
	 * Get one of 24 shades of grey (0=black, 23=white) (8 bit color)
	 * @param value Integer 0-23 (inclusive)
	 * @throws {EnforceTypeError} value isn't an int
	 * @throws {NotInRangeError} value isn't [0-23]
	 * @returns
	 */
	static grey24(value: number): Color {
		safety.intInRangeInc(value, 0, 23, 'value');
		const start = 232;
		return new Color([fg_expand, color_index, start + value]);
	}
	/**
	 * Get one of 216 (6**3) colors (8 bit color)
	 * @param r Integer 0-5 (inclusive) where 5=100%
	 * @param g Integer 0-5 (inclusive) where 5=100%
	 * @param b Integer 0-5 (inclusive) where 5=100%
	 * @throws {EnforceTypeError} r/g/b aren't an int
	 * @throws {NotInRangeError} r/g/b aren't [0-5]
	 * @returns
	 */
	static rgb6(r: number, g: number, b: number): Color {
		safety.intInRangeInc(r, 0, 5, 'r');
		safety.intInRangeInc(g, 0, 5, 'g');
		safety.intInRangeInc(b, 0, 5, 'b');
		const start = 16;
		//Grid starts at 16, r goes up by 36, g by 6, b by 1
		return new Color([fg_expand, color_index, start + r * 36 + g * 6 + b]);
	}
	/**
	 * Full red-green-blue color mixing (24 bit color, 16M colors)
	 * @param r Byte 0-0xff (will br truncated if oversized)
	 * @param g Byte 0-0xff (will br truncated if oversized)
	 * @param b Byte 0-0xff (will br truncated if oversized)
	 * @returns
	 */
	static rgb(r: number, g: number, b: number): Color {
		return new Color([fg_expand, color_rgb, r & 0xff, g & 0xff, b & 0xff]);
	}
}
/** Control background color of text (use with @see tty) */
export class BgColor extends StyleSet {
	protected constructor(on?: number[]) {
		super(49, on);
	}
	/** Default background color (clear any background color settings) */
	static get default(): BgColor {
		return new BgColor();
	}
	/** Set background color to black */
	static get black(): BgColor {
		return new BgColor([40]);
	}
	/** Set background color to red */
	static get red(): BgColor {
		return new BgColor([41]);
	}
	/** Set background color to green */
	static get green(): BgColor {
		return new BgColor([42]);
	}
	/** Set background color to yellow */
	static get yellow(): BgColor {
		return new BgColor([43]);
	}
	/** Set background color to blue */
	static get blue(): BgColor {
		return new BgColor([44]);
	}
	/** Set background color to magenta */
	static get magenta(): BgColor {
		return new BgColor([45]);
	}
	/** Set background color to cyan */
	static get cyan(): BgColor {
		return new BgColor([46]);
	}
	/** Set background color to white */
	static get white(): BgColor {
		return new BgColor([47]);
	}
	/**
	 * Get one of 24 shades of grey (0=black, 23=white) (8 bit color)
	 * @param value Integer 0-23 (inclusive)
	 * @throws {EnforceTypeError} value isn't an int
	 * @throws {NotInRangeError} value isn't [0-23]
	 * @returns
	 */
	static grey24(value: number): BgColor {
		safety.intInRangeInc(value, 0, 23, 'value');
		const start = 232;
		return new BgColor([bg_expand, color_index, start + value]);
	}
	/**
	 * Get one of 216 (6**3) colors (8 bit color)
	 * @param r Integer 0-5 (inclusive) where 5=100%
	 * @param g Integer 0-5 (inclusive) where 5=100%
	 * @param b Integer 0-5 (inclusive) where 5=100%
	 * @throws {EnforceTypeError} r/g/b aren't an int
	 * @throws {NotInRangeError} r/g/b aren't [0-5]
	 * @returns
	 */
	static rgb6(r: number, g: number, b: number): BgColor {
		safety.intInRangeInc(r, 0, 5, 'r');
		safety.intInRangeInc(g, 0, 5, 'g');
		safety.intInRangeInc(b, 0, 5, 'b');
		//Grid starts at 16, r goes up by 36, g by 6, b by 1
		const start = 16;
		return new BgColor([bg_expand, color_index, start + r * 36 + g * 6 + b]);
	}
	/**
	 * Full red-green-blue color mixing (24 bit color, 16M colors)
	 * @param r Byte 0-0xff (will br truncated if oversized)
	 * @param g Byte 0-0xff (will br truncated if oversized)
	 * @param b Byte 0-0xff (will br truncated if oversized)
	 * @returns
	 */
	static rgb(r: number, g: number, b: number): BgColor {
		return new BgColor([bg_expand, color_rgb, r & 0xff, g & 0xff, b & 0xff]);
	}
}
/** Reset all Select Graphic Rendition settings (including others)*/
export function reset(): string {
	return sgr(0);
}

/** Render TeleTYpewriter text /w CSI/SGR control codes - use as a template literal*/
export function tty(
	strings: TemplateStringsArray,
	...expressions: unknown[]
): string {
    const ret=[];
	const ctx = new StyleContext();
	for (let i = 0; i < expressions.length; i++) {
        ret.push(strings[i]);
		const e = expressions[i];
		if (e instanceof StyleSet) {
            ret.push(ctx.add(e));
		} else if (e instanceof Ctrl) {
            ret.push(e.exec());
		} else {
			//Anything that isn't a style set will just be added as a string
            ret.push(e);
		}
	}
	//Add the last string literal
    ret.push(strings[strings.length - 1]);
    //Add any cleanup
    ret.push(ctx.cleanup());
	return ret.join('');
}

/** Demo all of your terminal's features (not very useful for production) */
export function demo(): string {
	const largeFg = '◀▶';
	const largeBg = '◁▷';
	const smallFg = '◆';
	const smallBg = '◇';
	const w = 16;

	function effects(): string {
		let ret = tty`${Underline.single}Text styles (*=hide)` + '\n';

		//Note the weird `+']'; is because TTY will automatically undo any settings within, and
		// we don't want the close bracket to show the style
		ret +=
			tty` [${Underline.single}${stringExt.padStart('underline', w)}` + ']';
		ret +=
			tty` [${Underline.double}${stringExt.padStart('doubleUnder', w)}` + ']';
		ret +=
			tty` [${StrikeThrough.on}${stringExt.padStart('strikeThrough', w)}` + ']';
		ret += tty` [${Overline.on}${stringExt.padStart('overline', w)}` + ']\n';

		ret += tty` [${Weight.bold}${stringExt.padStart('bold', w)}` + ']';
		ret += tty` [${Weight.faint}${stringExt.padStart('faint', w)}` + ']';
		ret += tty` [${LetterStyle.italic}${stringExt.padStart('italic', w)}` + ']';
		ret +=
			tty` [${LetterStyle.gothic}${stringExt.padStart('gothic', w)}` + ']\n';

		ret += tty` [${Blink.slow}${stringExt.padStart('blinkSlow', w)}` + ']';
		ret += tty` [${Blink.fast}${stringExt.padStart('blinkFast', w)}` + ']';
		ret += tty` [${Invert.on}${stringExt.padStart('invert', w)}` + ']';
		ret += tty` [${Hide.on}${stringExt.padStart('hide', w - 1)}` + ']*\n';
		return ret;
	}

	function colors(): [string[], string[]] {
		const retFg: string[] = [];
		const retBg: string[] = [];

		let fg = tty`${Underline.single}Foreground colors (named)` + '\n';
		let bg = tty`${Underline.single}Background colors (named)` + '\n';
		const named = [
			'black',
			'red',
			'green',
			'yellow',
			'blue',
			'magenta',
			'cyan',
			'white',
		];
		for (let i = 0; i < named.length; i++) {
			// explicity any!  All to make composition slightly easier
			fg +=
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
				tty` [${(Color as any)[named[i]]}${stringExt.padStart(named[i], w)}` +
				']';
			bg +=
			    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                tty` [${(BgColor as any)[named[i]]}${stringExt.padStart(named[i], w)}` +
				']';
			if ((i & 3) === 3) {
				fg += '\n';
				bg += '\n';
			}
		}
		retFg.push(fg);
		retBg.push(bg);

		fg = tty`${Underline.single}Foreground colors (grey-24)` + '\n';
		bg = tty`${Underline.single}Background colors (grey-24)` + '\n';
		for (let i = 0; i < 24; i++) {
			fg += tty`${Color.grey24(i)}${largeFg}`;
			bg += tty`${BgColor.grey24(i)}${largeBg}`;
			if (i % 6 == 5) {
				fg += ' ';
				bg += ' ';
			}
		}
		retFg.push(fg + '\n');
		retBg.push(bg + '\n');

		fg = tty`${Underline.single}Foreground colors (rgb-6)` + '\n';
		bg = tty`${Underline.single}Background colors (rgb-6)` + '\n';
		for (let r = 0; r < 6; r++) {
			for (let g = 0; g < 6; g++) {
				for (let b = 0; b < 6; b++) {
					fg += tty`${Color.rgb6(r, g, b)}${largeFg}`;
					bg += tty`${BgColor.rgb6(r, g, b)}${largeBg}`;
				}
				fg += ' ';
				bg += ' ';
			}
			fg += '\n';
			bg += '\n';
		}
		retFg.push(fg);
		retBg.push(bg);

		fg = tty`${Underline.single}Foreground colors (rgb +=32)` + '\n';
		bg = tty`${Underline.single}Background colors (rgb +=32)` + '\n';
		for (let r = 0; r < 256; r += 32) {
			for (let g = 0; g < 256; g += 32) {
				for (let b = 0; b < 256; b += 32) {
					fg += tty`${Color.rgb(r, g, b)}${smallFg}`;
					bg += tty`${BgColor.rgb(r, g, b)}${smallBg}`;
				}
				fg += ' ';
				bg += ' ';
			}
			fg += '\n';
			bg += '\n';
		}
		retFg.push(fg);
		retBg.push(bg);

		return [retFg, retBg];
	}
	const [fg, bg] = colors();
	return [effects(), ...fg, ...bg].join('\n');
}

//Powershell (+vscode win)
// width: $Host.UI.RawUI.WindowSize.Width
// height: $Host.UI.RawUI.WindowSize.Height
//linux:
// width: tput cols = number
// height: tput lines = number
// both: stty size = lines cols
//cmd.exe
// @for /f tokens^=2 %L in ('mode con^|find "Lin"')do echo %~L
// @for /f tokens^=2 %L in ('mode con^|find "Col"')do echo %~L
