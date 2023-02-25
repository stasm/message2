import * as ast from "../syntax/ast.js";
import {Parser} from "../syntax/Parser.js";
import {FormattingContext} from "./FormattingContext.js";
import {FormattingFunc, MatchingFunc, Registry} from "./registry.js";
import {RuntimeValue} from "./RuntimeValue.js";

export class MessageFormat {
	locale: string;
	source: string;
	ast: ast.Message;

	constructor(locale: string, source: string) {
		this.locale = locale;
		this.source = source;
		this.ast = new Parser(source).parse();
	}

	format(vars: Record<string, RuntimeValue>): string {
		let ctx = new FormattingContext(this.locale, vars, this.ast.declarations);
		let variant = ctx.selectVariant(this.ast.variants, this.ast.selectors);
		return ctx.formatPattern(variant.pattern);
	}

	*formatToParts(vars: Record<string, RuntimeValue>): IterableIterator<MessagePart | OpaquePart> {
		let ctx = new FormattingContext(this.locale, vars, this.ast.declarations);
		let variant = ctx.selectVariant(this.ast.variants, this.ast.selectors);
		for (let value of ctx.resolvePattern(variant.pattern)) {
			yield* value.formatToParts(ctx);
		}
	}

	static registerFormatter(name: string, func: FormattingFunc) {
		Registry.formatters.set(name, func);
	}

	static registerMatcher(name: string, func: MatchingFunc) {
		Registry.matchers.set(name, func);
	}
}

export interface MessagePart {
	type: string;
	value: string;
}

export interface OpaquePart {
	type: "opaque";
	value: unknown;
}
