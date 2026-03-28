import { Schema } from "effect";

export const UUID = Schema.String.check(Schema.isUUID());
