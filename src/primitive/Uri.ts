// /*! Copyright 2023 gnabgib MPL-2.0 */

// //URI or URL? All URLs are URI

// export class Uri {
// }

// //https://www.rfc-editor.org/rfc/rfc8141.html
// // alpha a-zA-Z
// // digit 0-9
// // hex 0-9A-F

// export class Urn {
//     private readonly _nid:string;

//     get formal():bool {
//         return this._nid.startsWith('uri-');
//     }

//     private static validNid(input:string):boolean {
//         //These must be registered with IANA
//         const re=/[a-z0-9][a-z0-9-]*[a-z0-9]/g;
//         return input.match(re)!==null;
//     }
// }

// /**
//  * Build something upon first access to .value property (cache the result)
//  * @param factory Builder to call on first access 
//  */
// export class Lazy<T> {
// 	private _built = false;
// 	private _value!: T; //Prevent TS2564 with !
// 	constructor(private factory: () => T) {}
// 	get value() {
// 		if (!this._built) {
// 			this._value = this.factory();
// 			this._built = true;
// 		}
// 		return this._value;
// 	}
// }
