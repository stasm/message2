import {test} from "tap";
import {format_number, RuntimeNumber} from "../registry/number.js";
import {match_plural} from "../registry/plural.js";
import {MessageFormat} from "../runtime/index.js";

MessageFormat.registerFunction("number", format_number);
MessageFormat.registerFunction("plural", match_plural);

test("Plural selection depends on number formatting (English 1)", (tap) => {
	let message = new MessageFormat(
		"en-US",
		`
		let $count = {$count :number minimumFractionDigits=0}
		match {$count :plural}
		when one {You have {$count} apple.}
		when * {You have {$count} apples.}`
	);
	tap.equal(
		message.format({
			count: new RuntimeNumber(1),
		}),
		"You have 1 apple."
	);
	tap.same(
		message.formatToParts({
			count: new RuntimeNumber(1),
		}),
		[
			{type: "literal", value: "You have "},
			{type: "integer", value: "1"},
			{type: "literal", value: " apple."},
		]
	);
	tap.end();
});

test("Plural selection depends on number formatting (English 1.0)", (tap) => {
	let message = new MessageFormat(
		"en-US",
		`
		let $count = {$count :number minimumFractionDigits=1}
		match {$count :plural}
		when one {You have {$count} apple.}
		when * {You have {$count} apples.}`
	);
	tap.equal(
		message.format({
			count: new RuntimeNumber(1),
		}),
		"You have 1.0 apples."
	);
	tap.same(
		message.formatToParts({
			count: new RuntimeNumber(1),
		}),
		[
			{type: "literal", value: "You have "},
			{type: "integer", value: "1"},
			{type: "decimal", value: "."},
			{type: "fraction", value: "0"},
			{type: "literal", value: " apples."},
		]
	);
	tap.end();
});

test("Plural selection uses an exact numerical match despite number formatting (English 1.0)", (tap) => {
	let message = new MessageFormat(
		"en-US",
		`
		let $count = {$count :number minimumFractionDigits=1}
		match {$count :plural}
		when 1 {You have an apple.}
		when one {You have {$count} apple.}
		when * {You have {$count} apples.}`
	);
	tap.equal(
		message.format({
			count: new RuntimeNumber(1),
		}),
		"You have an apple."
	);
	tap.same(
		message.formatToParts({
			count: new RuntimeNumber(1),
		}),
		[{type: "literal", value: "You have an apple."}]
	);
	tap.end();
});

test("Set number formatting options at the callsite (English 1.0)", (tap) => {
	let message = new MessageFormat(
		"en-US",
		`
		match {$count :plural}
		when one {You have {$count} apple.}
		when * {You have {$count} apples.}`
	);
	tap.equal(
		message.format({
			count: new RuntimeNumber(1, {
				minimumFractionDigits: 1,
			}),
		}),
		"You have 1.0 apples."
	);
	tap.same(
		message.formatToParts({
			count: new RuntimeNumber(1, {
				minimumFractionDigits: 1,
			}),
		}),
		[
			{type: "literal", value: "You have "},
			{type: "integer", value: "1"},
			{type: "decimal", value: "."},
			{type: "fraction", value: "0"},
			{type: "literal", value: " apples."},
		]
	);
	tap.end();
});
