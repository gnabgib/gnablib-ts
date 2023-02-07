export function signMul(firstByte: number): number {
	//In big-endian, the first byte has the sign bit in the MSB position
	//It's 1 for negative, and 0 for positive.. but let's use math instead of branching
	// lookup: 1-> -1 0-> 1
	//Possible with: 1-bit*2
	//      0: 1-0*2 = 1
	//      1: 1-1*2 = -1
	return 1 - ((firstByte >> 7) & 1) * 2;
}
