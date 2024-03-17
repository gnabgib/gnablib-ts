/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { config } from '../src/runtime/Config.js';

config
	.define('demo', false)
	.importEnv('DEMO', (v,set) => {
		if (v!==undefined && v.length > 0) set(true);
	});

export {config}