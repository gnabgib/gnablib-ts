/*! Copyright 2024 the gnablib contributors MPL-1.1 */

// for internal-lib use only to avoid cyclical references (don't barrel/export)

/**
 * Select 3-bit foreground colors +gray
 */
export const color: Record<string, string> = {
	black: '\x1b[30m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m',
	white: '\x1b[37m',
	//This is in the "bright" bank (which we mostly ignore, but it's useful to have a gray)
	gray: '\x1b[90m',
	reset: '\x1b[39m',
};

/**
 * Select 3-bit background colors +gray
 */
export const bgColor: Record<string, string> = {
	black: '\x1b[40m',
	red: '\x1b[41m',
	green: '\x1b[42m',
	yellow: '\x1b[43m',
	blue: '\x1b[44m',
	magenta: '\x1b[45m',
	cyan: '\x1b[46m',
	white: '\x1b[47m',
	gray: '\x1b[100m',
	reset: '\x1b[49m',
};

/**
 * Select styles, in some terminals these can be combined (bold+underline)
 */
export const style:Record<string,string> = {
    reset:'\x1b[m',//Resets all style and color
    bold:'\x1b[1m',
    faint:'\x1b[2m',
    italic:'\x1b[3m',
    underline:'\x1b[4m',
    invert:'\x1b[7m',
    strike:'\x1b[9m',//mac Terminal.app doesn't support

    regularWeight:'\x1b[22m',
    notItalic:'\x1b[23m',
    notUnderline:'\x1b[24m',
    notStrike:'\x1b[29m',//mac Terminal.app doesn't support

    //dubious usefulness:
    //blink(5)
    //blink-fast(6) - low support
    //conceal(8) - why are we writing concealed text? it's recoverable
    //notInvert(27) - isn't that just invert?
}