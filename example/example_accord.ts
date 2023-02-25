import {test} from "tap";
import {format_adjective} from "../registry/adjective.js";
import {format_noun} from "../registry/noun.js";
import {RuntimeNumber} from "../registry/number.js";
import {match_plural} from "../registry/plural.js";
import {RuntimeTerm} from "../registry/term.js";
import {MessageFormat} from "../runtime/index.js";

MessageFormat.registerFunction("noun", format_noun);
MessageFormat.registerFunction("adjective", format_adjective);
MessageFormat.registerFunction("plural", match_plural);

test("This NOUN is ADJECTIVE. (English)", (tap) => {
	let message = new MessageFormat("en", "{This {$item :noun} is {$color :adjective}.}");
	tap.equal(
		message.format({
			item: new RuntimeTerm("jacket"),
			color: new RuntimeTerm("red"),
		}),
		"This jacket is red."
	);
	tap.same(
		message.formatToParts({
			item: new RuntimeTerm("jacket"),
			color: new RuntimeTerm("red"),
		}),
		[
			{type: "literal", value: "This "},
			{type: "noun", value: "jacket", grammatical_case: "nominative", grammatical_number: "one"},
			{type: "literal", value: " is "},
			{type: "adjective", value: "red"},
			{type: "literal", value: "."},
		]
	);
	tap.end();
});

test("This NOUN is ADJECTIVE. (Polish; requires according the gender of the adjective)", (tap) => {
	let message = new MessageFormat(
		"pl",
		`
		match {$item :noun inspect=gender}
		when feminine {Ta {$item :noun} jest {$color :adjective accord=$item}.}
		when neuter {To {$item :noun} jest {$color :adjective accord=$item}.}
		when * {Ten {$item :noun} jest {$color :adjective accord=$item}.}
		`
	);
	tap.equal(
		message.format({
			item: new RuntimeTerm("jacket"),
			color: new RuntimeTerm("red"),
		}),
		"Ta kurtka jest czerwona."
	);
	tap.same(
		message.formatToParts({
			item: new RuntimeTerm("jacket"),
			color: new RuntimeTerm("red"),
		}),
		[
			{type: "literal", value: "Ta "},
			{type: "noun", value: "kurtka", grammatical_case: "nominative", grammatical_number: "one"},
			{type: "literal", value: " jest "},
			{
				type: "adjective",
				value: "czerwona",
				grammatical_gender: "feminine",
				grammatical_case: "nominative",
				grammatical_number: "one",
			},
			{type: "literal", value: "."},
		]
	);
	tap.end();
});

test("You have COUNT ADJECTIVE NOUN that you can sell. (Polish; requires according the gender, case, and number between the adjective and the noun)", (tap) => {
	let message = new MessageFormat(
		"pl",
		`
		let $item = {$item :noun number=$count case=accusative}
		let $color = {$color :adjective accord=$item}

		match {$item :noun inspect=gender} {$count :plural}

		when feminine one {Masz {$count} {$color} {$item}, którą możesz sprzedać.}
		when feminine few {Masz {$count} {$color} {$item}, które możesz sprzedać.}
		when feminine many {Masz {$count} {$color} {$item}, które możesz sprzedać.}

		when neuter one {Masz {$count} {$color} {$item}, które możesz sprzedać.}
		when neuter few {Masz {$count} {$color} {$item}, które możesz sprzedać.}
		when neuter many {Masz {$count} {$color} {$item}, które możesz sprzedać.}

		when inanimate one {Masz {$count} {$color} {$item}, który możesz sprzedać.}
		when inanimate few {Masz {$count} {$color} {$item}, które możesz sprzedać.}
		when inanimate many {Masz {$count} {$color} {$item}, które możesz sprzedać.}

		when animate one {Masz {$count} {$color} {$item}, którego możesz sprzedać.}
		when animate few {Masz {$count} {$color} {$item}, które możesz sprzedać.}
		when animate many {Masz {$count} {$color} {$item}, które możesz sprzedać.}

		when personal one {Masz {$count} {$color} {$item}, którego możesz sprzedać.}
		when personal few {Masz {$count} {$color} {$item}, których możesz sprzedać.}
		when personal many {Masz {$count} {$color} {$item}, których możesz sprzedać.}
		`
	);
	tap.equal(
		message.format({
			item: new RuntimeTerm("jacket"),
			color: new RuntimeTerm("red"),
			count: new RuntimeNumber(1),
		}),
		"Masz 1 czerwoną kurtkę, którą możesz sprzedać."
	);
	tap.same(
		message.formatToParts({
			item: new RuntimeTerm("jacket"),
			color: new RuntimeTerm("red"),
			count: new RuntimeNumber(1),
		}),
		[
			{type: "literal", value: "Masz "},
			{type: "integer", value: "1"},
			{type: "literal", value: " "},
			{
				type: "adjective",
				value: "czerwoną",
				grammatical_gender: "feminine",
				grammatical_case: "accusative",
				grammatical_number: "one",
			},
			{type: "literal", value: " "},
			{type: "noun", value: "kurtkę", grammatical_case: "accusative", grammatical_number: "one"},
			{type: "literal", value: ", którą możesz sprzedać."},
		]
	);
	tap.end();
});
