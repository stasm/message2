import {test} from "tap";
import {Formattable, FormattingContext, MessageFormat, RuntimeString} from "../impl/index.js";
import {REGISTRY_FORMAT} from "../impl/registry.js";
import * as ast from "../syntax/ast.js";
import {get_term} from "./glossary.js";

REGISTRY_FORMAT["noun"] = function get_noun(
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

	if (opts["lettercase"]) {
		let lettercase = ctx.resolveOperand(opts["lettercase"]);
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
};

REGISTRY_FORMAT["adjective"] = function get_adjective(
	ctx: FormattingContext,
	arg: ast.Operand | null,
	opts: ast.Options
): Formattable {
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
			let noun_name = ctx.resolveOperand(opts["accord"]);
			if (!(noun_name instanceof RuntimeString)) {
				throw new TypeError();
			}

			let noun = get_term(ctx.locale, noun_name.value);
			let adjective = get_term(ctx.locale, adj_name.value);
			return new RuntimeString(adjective["singular_" + noun["gender"]].toString());
		}
		default:
			return new RuntimeString(adj_name.toString());
	}
};

test("NOUN is ADJECTIVE (English)", (tap) => {
	let message = new MessageFormat("en", "{The {$item :noun} is {$color :adjective}.}");
	tap.equal(
		message.format({
			item: new RuntimeString("t-shirt"),
			color: new RuntimeString("red"),
		}),
		"The T-shirt is red."
	);
	tap.same(
		message.formatToParts({
			item: new RuntimeString("t-shirt"),
			color: new RuntimeString("red"),
		}),
		[
			{type: "literal", value: "The "},
			{type: "literal", value: "T-shirt"},
			{type: "literal", value: " is "},
			{type: "literal", value: "red"},
			{type: "literal", value: "."},
		]
	);
	tap.end();
});

test("NOUN is ADJECTIVE (Polish; requires according the gender of the adjective)", (tap) => {
	let message = new MessageFormat(
		"pl",
		"{{$item :noun lettercase=capitalized} jest {$color :adjective accord=$item}.}"
	);
	tap.equal(
		message.format({
			item: new RuntimeString("t-shirt"),
			color: new RuntimeString("red"),
		}),
		"Tiszert jest czerwony."
	);
	tap.same(
		message.formatToParts({
			item: new RuntimeString("t-shirt"),
			color: new RuntimeString("red"),
		}),
		[
			{type: "literal", value: "Tiszert"},
			{type: "literal", value: " jest "},
			{type: "literal", value: "czerwony"},
			{type: "literal", value: "."},
		]
	);
	tap.end();
});
