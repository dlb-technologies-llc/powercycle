import { Schema } from "effect";

export class InvalidRoundError extends Schema.TaggedErrorClass<InvalidRoundError>()(
	"InvalidRoundError",
	{
		round: Schema.Number,
	},
) {}

export class InvalidDayError extends Schema.TaggedErrorClass<InvalidDayError>()(
	"InvalidDayError",
	{
		day: Schema.Number,
	},
) {}

export class RestDayError extends Schema.TaggedErrorClass<RestDayError>()(
	"RestDayError",
	{
		day: Schema.Number,
	},
) {}
