/*! Copyright 2023 the gnablib contributors MPL-1.1 */

import { IProblem } from "../../error/probs/interfaces/IProblem.js";

export interface IValid<T> {
	valid(input: T | undefined): IProblem | undefined;
}
