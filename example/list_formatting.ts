import {test} from "tap";
import {format_list, match_length, RuntimeList} from "../registry/list.js";
import {map_person, Person} from "../registry/person.js";
import {MessageFormat} from "../runtime/index.js";

MessageFormat.registerFunction("length", match_length);
MessageFormat.registerFunction("list", format_list);
MessageFormat.registerFunction("person.each", map_person);

test("Fancy list formatting, first names only", (tap) => {
	let message = new MessageFormat(
		"ro",
		`
		let $names = {$names :person.each declension=dative name=first}
		let $names = {$names :list style=long type=conjunction}
		match {$names :length}
		when one {I-am dat cadouri {$names}.}
		when * {Le-am dat cadouri {$names}.} `
	);
	tap.equal(
		message.format({
			names: new RuntimeList([
				new Person("Maria", "Stanescu"),
				new Person("Ileana", "Zamfir"),
				new Person("Petre", "Belu"),
			]),
		}),
		"Le-am dat cadouri Mariei, Ilenei și lui Petre."
	);
	tap.same(
		message.formatToParts({
			names: new RuntimeList([
				new Person("Maria", "Stanescu"),
				new Person("Ileana", "Zamfir"),
				new Person("Petre", "Belu"),
			]),
		}),
		[
			{type: "literal", value: "Le-am dat cadouri "},
			{type: "element", value: "Mariei"},
			{type: "literal", value: ", "},
			{type: "element", value: "Ilenei"},
			{type: "literal", value: " și "},
			{type: "element", value: "lui Petre"},
			{type: "literal", value: "."},
		]
	);
	tap.end();
});

test("Fancy list formatting, full names", (tap) => {
	let message = new MessageFormat(
		"ro",
		`
		let $names = {$names :person.each declension=dative name=full}
		let $names = {$names :list style=long type=disjunction}
		match {$names :length}
		when one {I-am dat cadouri {$names}.}
		when * {Le-am dat cadouri {$names}.} `
	);

	tap.equal(
		message.format({
			names: new RuntimeList([
				new Person("Maria", "Stanescu"),
				new Person("Ileana", "Zamfir"),
				new Person("Petre", "Belu"),
			]),
		}),
		"Le-am dat cadouri Mariei Stanescu, Ilenei Zamfir sau lui Petre Belu."
	);

	tap.same(
		message.formatToParts({
			names: new RuntimeList([
				new Person("Maria", "Stanescu"),
				new Person("Ileana", "Zamfir"),
				new Person("Petre", "Belu"),
			]),
		}),
		[
			{type: "literal", value: "Le-am dat cadouri "},
			{type: "element", value: "Mariei Stanescu"},
			{type: "literal", value: ", "},
			{type: "element", value: "Ilenei Zamfir"},
			{type: "literal", value: " sau "},
			{type: "element", value: "lui Petre Belu"},
			{type: "literal", value: "."},
		]
	);

	tap.end();
});
