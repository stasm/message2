import {get_term} from "../example/glossary.js";
import {Formattable, FormattingContext, RuntimeString} from "../runtime/index.js";
import * as ast from "../syntax/ast.js";

export function format_noun(
	ctx: FormattingContext,
	arg: ast.Operand | null,
	opts: ast.Options
): Formattable {
	if (arg === null) {
		throw new TypeError();
	}
	let noun_name = ctx.resolveOperand(arg);
	if (!(noun_name instanceof RuntimeString)) {
		throw new TypeError();
	}

	let noun = get_term(ctx.locale, noun_name.value);
	let value = noun["singular_nominative"].toString();

	if (opts.has("lettercase")) {
		let lettercase = ctx.resolveOperand(opts.get("lettercase"));
		if (lettercase instanceof RuntimeString) {
			if (lettercase.value === "capitalized") {
				// TODO(stasm): Support surrogates and astral codepoints.
				return new RuntimeString(value[0].toUpperCase() + value.slice(1));
			}
		} else {
			throw new TypeError();
		}
	}

	return new RuntimeString(value);
}
