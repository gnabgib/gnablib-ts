/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { BitWriter } from "../BitWriter.js";

/** Whether a type can be serialized */
export interface ISerializer {
	/** Serialize into bytes (via a copy) */
	serialize(target:BitWriter): void;
}
