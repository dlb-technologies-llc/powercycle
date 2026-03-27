/**
 * Recursively strips `readonly` modifiers from Effect Schema types.
 * Effect schemas produce readonly arrays/objects; React components
 * often need mutable versions for state patterns.
 */
export type DeepMutable<T> =
	T extends ReadonlyArray<infer U>
		? Array<DeepMutable<U>>
		: T extends object
			? { -readonly [K in keyof T]: DeepMutable<T[K]> }
			: T;
