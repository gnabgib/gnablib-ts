/** Note: Because JS doesn't distinguish between int/float this signature matches IRandFloat */
export interface IRandInt {
	/** Generate a random int32 [-2147483648 - 2147483647]*/
	(): number;
}
