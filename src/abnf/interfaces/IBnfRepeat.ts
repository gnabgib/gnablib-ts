/*! Copyright 2023 the gnablib contributors MPL-1.1 */

import { IBnf } from './IBnf.js';

export interface IBnfRepeat extends IBnf {
	get rule(): IBnf;
}
