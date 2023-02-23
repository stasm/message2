import {test} from "tap";
import {match_equals} from "../registry/equals.js";
import {match_plural, RuntimeNumber} from "../registry/number.js";
import {MessageFormat, RuntimeString} from "../runtime/index.js";

MessageFormat.registerMatcher("equals", match_equals);
MessageFormat.registerMatcher("plural", match_plural);

test("Plural selection (English: one wins)", (tap) => {
	let message = new MessageFormat(
		"en-US",
		`
		match {$count :plural}
		when one {You have {$count} new message.}
		when * {You have {$count} new messages.}`
	);
	tap.equal(
		message.format({
			count: new RuntimeNumber(1),
		}),
		"You have 1 new message."
	);
	tap.same(
		message.formatToParts({
			count: new RuntimeNumber(1),
		}),
		[
			{type: "literal", value: "You have "},
			{type: "integer", value: "1"},
			{type: "literal", value: " new message."},
		]
	);
	tap.end();
});

test("Plural selection (English: 1 wins)", (tap) => {
	let message = new MessageFormat(
		"en-US",
		`
		match {$count :plural}
		when 1 {You have a new message.}
		when one {You have {$count} new message.}
		when * {You have {$count} new messages.}`
	);
	tap.equal(
		message.format({
			count: new RuntimeNumber(1),
		}),
		"You have a new message."
	);
	tap.same(
		message.formatToParts({
			count: new RuntimeNumber(1),
		}),
		[{type: "literal", value: "You have a new message."}]
	);
	tap.end();
});

test("Plural selection (English: * wins)", (tap) => {
	let message = new MessageFormat(
		"en-US",
		`
		match {$count :plural}
		when * {You have {$count} new messages.}
		when 1 {You have a new message.}
		when one {You have {$count} new message.}`
	);
	tap.equal(
		message.format({
			count: new RuntimeNumber(1),
		}),
		"You have 1 new messages."
	);
	tap.same(
		message.formatToParts({
			count: new RuntimeNumber(1),
		}),
		[
			{type: "literal", value: "You have "},
			{type: "integer", value: "1"},
			{type: "literal", value: " new messages."},
		]
	);
	tap.end();
});

test("Multiple selection (English)", (tap) => {
	let message = new MessageFormat(
		"en-US",
		`match {$photoCount :plural} {$userGender :equals}
		 when one masculine {{$userName} added a new photo to his album.}
		 when one feminine {{$userName} added a new photo to her album.}
		 when one * {{$userName} added a new photo to their album.}
		 when * masculine {{$userName} added {$photoCount} new photos to his album.}
		 when * feminine {{$userName} added {$photoCount} new photos to her album.}
		 when * * {{$userName} added {$photoCount} new photos to their album.}`
	);
	tap.equal(
		message.format({
			userName: new RuntimeString("Alice"),
			userGender: new RuntimeString("feminine"),
			photoCount: new RuntimeNumber(1),
		}),
		"Alice added a new photo to her album."
	);
	tap.same(
		message.formatToParts({
			userName: new RuntimeString("Alice"),
			userGender: new RuntimeString("feminine"),
			photoCount: new RuntimeNumber(1),
		}),
		[
			{type: "literal", value: "Alice"},
			{type: "literal", value: " added a new photo to her album."},
		]
	);
	tap.equal(
		message.format({
			userName: new RuntimeString("Bob"),
			userGender: new RuntimeString("unknown"),
			photoCount: new RuntimeNumber(2),
		}),
		"Bob added 2 new photos to their album."
	);
	tap.same(
		message.formatToParts({
			userName: new RuntimeString("Bob"),
			userGender: new RuntimeString("unknown"),
			photoCount: new RuntimeNumber(2),
		}),
		[
			{type: "literal", value: "Bob"},
			{type: "literal", value: " added "},
			{type: "integer", value: "2"},
			{type: "literal", value: " new photos to their album."},
		]
	);
	tap.end();
});
