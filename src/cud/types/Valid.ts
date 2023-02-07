
export interface Valid<T> {
    valid(input: T|undefined): Error|undefined;
}
