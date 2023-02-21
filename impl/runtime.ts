import {FormattingContext} from "./FormattingContext.js";
import {Message} from "./model.js";
import {RuntimePart, RuntimeValue} from "./RuntimeValue.js";

export * from "./FormattingContext.js";
export * from "./RuntimeString.js";
export * from "./RuntimeValue.js";

export function formatMessage(message: Message, vars: Record<string, RuntimeValue>): string {
	let ctx = new FormattingContext(message.lang, message, vars);
	let variant = ctx.selectVariant(message.variants, message.selectors);
	return ctx.formatPattern(variant.value);
}

export function* formatToParts(
	message: Message,
	vars: Record<string, RuntimeValue>
): IterableIterator<RuntimePart> {
	let ctx = new FormattingContext(message.lang, message, vars);
	let variant = ctx.selectVariant(message.variants, message.selectors);
	for (let value of ctx.resolvePattern(variant.value)) {
		yield* value.formatToParts(ctx);
	}
}
