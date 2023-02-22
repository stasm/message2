import {get_term} from "../example/glossary.js";
import {Formattable, FormattingContext, RuntimeString} from "../runtime/index.js";
import * as ast from "../syntax/ast.js";

export function format_actor(
	ctx: FormattingContext,
	arg: ast.Operand | null,
	opts: ast.Options
): Formattable {
	if (arg === null) {
		throw new TypeError();
	}
	let name = ctx.resolveOperand(arg);
	if (!(name instanceof RuntimeString)) {
		throw new TypeError();
	}

	let term = get_term(ctx.locale, "actor_" + name.value);

	switch (ctx.locale) {
		case "en": {
			let value: string;
			if (opts.has("article")) {
				let article = ctx.resolveOperand(opts.get("article"));
				if (!(article instanceof RuntimeString)) {
					throw new TypeError();
				}
				if (article.value === "definite") {
					value = term["definite"].toString();
				} else if (article.value === "indefinite") {
					value = term["indefinite"].toString();
				} else {
					value = term["bare"].toString();
				}
			} else {
				value = term["bare"].toString();
			}

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

		case "pl": {
			let value;
			if (opts.has("case")) {
				let declension = ctx.resolveOperand(opts.get("case"));
				if (!(declension instanceof RuntimeString)) {
					throw new TypeError();
				}
				value = term[declension.value].toString();
			} else {
				value = term["nominative"].toString();
			}

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
		default:
			return new RuntimeString(name.value);
	}
}
