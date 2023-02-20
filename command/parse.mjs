import {readFileSync} from "fs";
import {createInterface} from "readline";
import {Parser} from "../impl/Parser.js";

function exit_help(exit_code) {
	console.log(`
    Parse a message and print its AST.

        Usage: node parse.mjs [FILE]

        When FILE is not specified, read text from stdin.

    Examples:

        node parse.mjs path/to/file.txt
        node parse.mjs <(echo "{Hello, world!}")
        cat path/to/file.txt | node parse.mjs

    Options:

        -h, --help      Display help and quit.
`);
	process.exit(exit_code);
}

function main_stdin() {
	const rl = createInterface({
		input: process.stdin,
		output: process.stdout,
		prompt: "parser>",
	});

	const lines = [];

	rl.on("line", (line) => lines.push(line));
	rl.on("close", () => main(lines.join("\n") + "\n"));
}

function main_file(file_path) {
	let content = readFileSync(file_path, "utf8");
	main(content);
}

function main(content) {
	let parser = new Parser(content);
	let ast = parser.to_ast();
	let json = JSON.stringify(ast, null, 4);
	console.log(json);
	try {
	} catch (e) {
		console.error(`
[${e.name} at ${e.start}-${e.end}] ${e.message}`);
	}
}

let [$1] = process.argv.slice(2);
if ($1 === "-h" || $1 === "--help") {
	exit_help(1);
}

if ($1) {
	main_file($1);
} else {
	main_stdin();
}
