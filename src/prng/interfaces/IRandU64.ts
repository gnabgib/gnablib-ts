import { U64 } from "../../primitive/number/U64.js";

export interface IRandU64 {
	/** Generate a random unt64 [0 - 0xffffffffffffffff]*/
	(): U64;
}