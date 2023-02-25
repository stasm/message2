import {readFileSync} from "fs";
import {FormattingContext, RuntimeValue} from "../runtime/index.js";
import * as ast from "../syntax/ast.js";

export interface Term {
	canonical: string;
	[key: string]: string;
}

export class RuntimeTerm implements RuntimeValue {
	name: string;

	constructor(name: string) {
		this.name = name;
	}

	get_term(ctx: FormattingContext): Term {
		let file_name = `glossary/${ctx.locale}.json`;
		// TODO(stasm): Don't read the file every time.
		let file_data = readFileSync(new URL(file_name, import.meta.url), "utf8");
		let glossary = JSON.parse(file_data) as {
			[key: string]: Term;
		};
		return glossary[this.name];
	}

	formatToString(ctx: FormattingContext): string {
		let term = this.get_term(ctx);
		switch (ctx.locale) {
			case "en":
			case "pl":
				return term.canonical;
		}
		throw new ReferenceError("Unknown term: " + this.name);
	}

	*formatToParts(ctx: FormattingContext) {
		yield {type: "term", value: this.formatToString(ctx)};
	}

	match(ctx: FormattingContext, key: ast.Literal) {
		return false;
	}
}
