// Nondeterministic Finite Automata (NFA) + Thompson solver
// [Programming Techniques: Regular expression search algorithm](https://dl.acm.org/doi/10.1145/363347.363387)
// [Regular Expression Matching Can Be Simple And Fast](https://swtch.com/~rsc/regexp/regexp1.html)

export interface IMatcher {
    match(charCode: number): boolean;
    toString(): string;
}
