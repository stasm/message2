import {test} from "tap";
import {Formattable, FormattingContext, MessageFormat, RuntimeString} from "../runtime/index.js";
import {REGISTRY_FORMAT} from "../runtime/registry.js";
import * as ast from "../syntax/ast.js";
import {get_term} from "./glossary.js";

REGISTRY_FORMAT["actor"] = function get_actor(
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
};

test("Subject verb OBJECT (English)", (tap) => {
	let message = new MessageFormat("en", "{You see {$monster :actor article=indefinite}!}");
	tap.equal(
		message.format({
			monster: new RuntimeString("dinosaur"),
		}),
		"You see a dinosaur!"
	);
	tap.same(
		message.formatToParts({
			monster: new RuntimeString("dinosaur"),
		}),
		[
			{type: "literal", value: "You see "},
			{type: "literal", value: "a dinosaur"},
			{type: "literal", value: "!"},
		]
	);
	tap.end();
});

test("Subject verb OBJECT (Polish; requires the accusative case)", (tap) => {
	let message = new MessageFormat("pl", "{Widzisz {$monster :actor case=accusative}!}");
	tap.equal(
		message.format({
			monster: new RuntimeString("dinosaur"),
		}),
		"Widzisz dinozaura!"
	);
	tap.same(
		message.formatToParts({
			monster: new RuntimeString("dinosaur"),
		}),
		[
			{type: "literal", value: "Widzisz "},
			{type: "literal", value: "dinozaura"},
			{type: "literal", value: "!"},
		]
	);
	tap.end();
});

test("SUBJECT verb (English)", (tap) => {
	let message = new MessageFormat(
		"en",
		"{{$monster :actor article=definite lettercase=capitalized} waves at you!}"
	);
	tap.equal(
		message.format({
			monster: new RuntimeString("ogre"),
		}),
		"The ogre waves at you!"
	);
	tap.same(
		message.formatToParts({
			monster: new RuntimeString("ogre"),
		}),
		[
			{type: "literal", value: "The ogre"},
			{type: "literal", value: " waves at you!"},
		]
	);
	tap.end();
});

test("SUBJECT verb (Polish)", (tap) => {
	let message = new MessageFormat(
		"pl",
		"{{$monster :actor case=nominative lettercase=capitalized} macha do ciebie!}"
	);
	tap.equal(
		message.format({
			monster: new RuntimeString("ogre"),
		}),
		"Ogr macha do ciebie!"
	);
	tap.same(
		message.formatToParts({
			monster: new RuntimeString("ogre"),
		}),
		[
			{type: "literal", value: "Ogr"},
			{type: "literal", value: " macha do ciebie!"},
		]
	);
	tap.end();
});
