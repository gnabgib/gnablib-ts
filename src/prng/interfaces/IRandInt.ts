/** Note: Because JS doesn't distinguish between int/float this signature matches IRandFloat, IRandU* */
export interface IRandInt {
	/** Generate a random int32 [-2147483648 - 2147483647]*/
	(): number;
}

/** Note: Because JS doesn't distinguish between int/float this signature matches IRandFloat, IRandInt|U31|U32 */
export interface IRandU16 {
	/** Generate a random uint16 [0 - 32767]*/
	(): number;
}

/** Note: Because JS doesn't distinguish between int/float this signature matches IRandFloat, IRandInt|U16|U32 */
export interface IRandU31 {
	/** Generate a random uint32 [0 - 2147483647]*/
	(): number;
}

/** Note: Because JS doesn't distinguish between int/float this signature matches IRandFloat, IRandInt|U16|U31 */
export interface IRandU32 {
	/** Generate a random uint32 [0 - 4294967295]*/
	(): number;
}