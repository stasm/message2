import {test} from "tap";
import {format_adjective} from "../registry/adjective.js";
import {format_noun} from "../registry/noun.js";
import {MessageFormat, RuntimeString} from "../runtime/index.js";

MessageFormat.registerFormatter("noun", format_noun);
MessageFormat.registerFormatter("adjective", format_adjective);

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
