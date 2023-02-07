//[Longitudinal redundancy check](https://en.wikipedia.org/wiki/Longitudinal_redundancy_check)
export function lrc(bytes: Uint8Array): number {
	let sum = 0;
	for (const byte of bytes) {
		sum = (sum + byte) & 0xff;
	}
	sum = (~sum + 1) & 0xff;
	return sum;
}
