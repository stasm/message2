import {test} from "tap";
import {format_actor} from "../registry/actor.js";
import {MessageFormat, RuntimeString} from "../runtime/index.js";

MessageFormat.registerFormatter("actor", format_actor);

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
	let message = new MessageFormat("en", "{{$monster :actor article=definite lettercase=capitalized} waves at you!}");
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
