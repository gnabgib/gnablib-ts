/*! Copyright 2024 the gnablib contributors MPL-1.1 */

/**
 * Provide a variable wrapped in curly braces (turning it into an object) and get
 * back a two part array, the first being the name, the second being the value. Useful
 * for debugging
 * 
 * eg:
 * ```
 * const myVariable='something';
 * const [name,value]=nameValue({myVariable});
 * //name='myVariable', value='something'
 * ```
 * @param obj Variable wrapped in curly braces
 * @returns Two element array [name, value]
 */
export function nameValue<T>(obj:Record<string,T>):[string,T] {
    const name=Object.keys(obj)[0];
    return [name,obj[name]];
}