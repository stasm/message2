import {test} from "tap";
import {MessageFormat} from "../runtime/index.js";
import {RuntimeNumber} from "../runtime/registry.js";

test("Number formatting (English)", (tap) => {
	let message = new MessageFormat(
		"en-US",
		"{Transferred {$payloadSize :number style=unit unit=megabyte}.}"
	);
	tap.equal(
		message.format({
			payloadSize: new RuntimeNumber(1.23),
		}),
		"Transferred 1.23 MB."
	);
	tap.same(
		message.formatToParts({
			payloadSize: new RuntimeNumber(1.23),
		}),
		[
			{type: "literal", value: "Transferred "},
			{type: "integer", value: "1"},
			{type: "decimal", value: "."},
			{type: "fraction", value: "23"},
			{type: "literal", value: " "},
			{type: "unit", value: "MB"},
			{type: "literal", value: "."},
		]
	);
	tap.end();
});

test("Number formatting (French)", (tap) => {
	let message = new MessageFormat(
		"fr",
		"{{$payloadSize :number style=unit unit=megabyte} transféré.}"
	);
	tap.equal(
		message.format({
			payloadSize: new RuntimeNumber(1.23),
		}),
		"1,23 Mo transféré."
	);
	tap.same(
		message.formatToParts({
			payloadSize: new RuntimeNumber(1.23),
		}),
		[
			{type: "integer", value: "1"},
			{type: "decimal", value: ","},
			{type: "fraction", value: "23"},
			{type: "literal", value: " "}, // U+202F
			{type: "unit", value: "Mo"},
			{type: "literal", value: " transféré."},
		]
	);
	tap.end();
});
