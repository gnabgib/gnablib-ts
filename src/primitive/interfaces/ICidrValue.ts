/*! Copyright 2023 the gnablib contributors MPL-1.1 */

import { Cidr } from '../net/Cidr.js';

export interface ICidrValue<T> {
	get cidr(): Cidr;
	get value(): T|undefined;
}
