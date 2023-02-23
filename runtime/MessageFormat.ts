import * as ast from "../syntax/ast.js";
import {Parser} from "../syntax/Parser.js";
import {FormattingContext} from "./FormattingContext.js";
import {FormattingFunc, MatchingFunc, Registry} from "./registry.js";
import {RuntimePart, RuntimeValue} from "./RuntimeValue.js";

export class MessageFormat {
	locale: string;
	source: string;
	parsed: ast.Message;

	constructor(locale: string, source: string) {
		this.locale = locale;
		this.source = source;
		this.parsed = new Parser(source).parse();
	}

	format(vars: Record<string, RuntimeValue>): string {
		let ctx = new FormattingContext(this.locale, vars, this.parsed.locals);
		let variant = ctx.selectVariant(this.parsed.variants, this.parsed.selectors);
		return ctx.formatPattern(variant.pattern);
	}

	*formatToParts(vars: Record<string, RuntimeValue>): IterableIterator<RuntimePart> {
		let ctx = new FormattingContext(this.locale, vars, this.parsed.locals);
		let variant = ctx.selectVariant(this.parsed.variants, this.parsed.selectors);
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