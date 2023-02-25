import * as ast from "../syntax/ast.js";
import {Parser} from "../syntax/Parser.js";
import {FormattingContext} from "./FormattingContext.js";
import {CustomFunction, Registry} from "./registry.js";
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
		let output = "";
		for (let value of ctx.resolvePattern(variant.pattern)) {
			output += value.formatToString(ctx);
		}
		return output;
	}

	*formatToParts(vars: Record<string, RuntimeValue>): IterableIterator<MessagePart> {
		let ctx = new FormattingContext(this.locale, vars, this.ast.declarations);
		let variant = ctx.selectVariant(this.ast.variants, this.ast.selectors);
		for (let value of ctx.resolvePattern(variant.pattern)) {
			yield* value.formatToParts(ctx);
		}
	}

	static registerFunction(name: string, func: CustomFunction) {
		Registry.functions.set(name, func);
	}
}

export interface MessagePart {
	type: string;
	value: string;
}
