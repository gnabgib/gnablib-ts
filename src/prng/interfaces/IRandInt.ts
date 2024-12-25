/** Note: Because JS doesn't distinguish between int/float this signature matches IRandFloat */
export interface IRandInt {
	/** Generate a random int32 [-2147483648 - 2147483647]*/
	(): number;
}

/** Note: Because JS doesn't distinguish between int/float this signature matches IRandFloat, IRandInt */
export interface IRandUInt {
	/** Generate a random uint32 [0 - 4294967295]*/
	(): number;
}