import {test} from "tap";
import {listOfPeople, pluralOfLength, RuntimeList} from "../registry/list.js";
import {MessageFormat} from "../runtime/index.js";

MessageFormat.registerMatcher("pluralOfLength", pluralOfLength);
MessageFormat.registerFormatter("listOfPeople", listOfPeople);

class Person {
	firstName: string;
	lastName: string;

	constructor(firstName: string, lastName: string) {
		this.firstName = firstName;
		this.lastName = lastName;
	}
}

test("Fancy list formatting, first names only", (tap) => {
	let message = new MessageFormat(
		"ro",
		`match {$names :pluralOfLength}
		 when one {I-am dat cadouri {$names :listOfPeople style=long type=conjunction case=dative name=first}.}
		 when * {Le-am dat cadouri {$names :listOfPeople style=long type=conjunction case=dative name=first}.} `
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
		`match {$names :pluralOfLength}
		 when one {I-am dat cadouri {$names :listOfPeople style=long type=disjunction case=dative name=full}.}
		 when * {Le-am dat cadouri {$names :listOfPeople style=long type=disjunction case=dative name=full}.} `
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
