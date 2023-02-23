import {get_term} from "../example/glossary.js";
import {Formattable, FormattingContext, RuntimeString} from "../runtime/index.js";
import * as ast from "../syntax/ast.js";

export function format_adjective(ctx: FormattingContext, arg: ast.Operand | null, opts: ast.Options): Formattable {
	if (arg === null) {
		throw new TypeError();
	}
	let adj_name = ctx.resolveOperand(arg);
	if (!(adj_name instanceof RuntimeString)) {
		throw new TypeError();
	}

	switch (ctx.locale) {
		case "en": {
			let adjective = get_term(ctx.locale, adj_name.value);
			return new RuntimeString(adjective["nominative"].toString());
		}
		case "pl": {
			let noun_name = ctx.resolveOperand(opts.get("accord"));
			if (!(noun_name instanceof RuntimeString)) {
				throw new TypeError();
			}

			let noun = get_term(ctx.locale, noun_name.value);
			let adjective = get_term(ctx.locale, adj_name.value);
			return new RuntimeString(adjective["singular_" + noun["gender"]].toString());
		}
		default:
			return adj_name;
	}
}
