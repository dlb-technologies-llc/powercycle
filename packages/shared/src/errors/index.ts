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

export class NotFoundError extends Schema.TaggedErrorClass<NotFoundError>()(
	"NotFoundError",
	{
		message: Schema.String,
		resource: Schema.String,
	},
) {}

export class ValidationError extends Schema.TaggedErrorClass<ValidationError>()(
	"ValidationError",
	{
		message: Schema.String,
		field: Schema.optional(Schema.String),
	},
) {}

export class InternalError extends Schema.TaggedErrorClass<InternalError>()(
	"InternalError",
	{
		message: Schema.String,
	},
) {}
