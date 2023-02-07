/**
 * Escape a string for use in a regex.. using a regex.. regex inception
 * @param string String escape
 * @returns Safe version
 */
export function escape(string:string):string {
    // Both - and / are safe but overly cautious is ok
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}