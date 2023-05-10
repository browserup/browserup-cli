export declare class Enumify {
    static enumKeys: Array<string>;
    static enumValues: Array<Enumify>;
    static closeEnum(): void;
    /** Use case: parsing enum values */
    static enumValueOf(str: string): undefined | Enumify;
    static [Symbol.iterator](): IterableIterator<Enumify>;
    enumKey: string;
    enumOrdinal: number;
    toString(): string;
}
