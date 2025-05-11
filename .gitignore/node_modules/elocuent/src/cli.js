#!/usr/bin/env node
import { program } from "commander";
import defaults from "./defaults.js";
import run from "../src/index.js";

// Read package.json for version & description
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import * as path from 'path';

// __dirname is not available in ESM, so we recreate it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJsonPath = path.join(__dirname, "../package.json");
const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

program
	.name("eʟᴏᴄuent")
	.description(pkg.description)
	.version(pkg.version)
	.option("-i, --input <input>", "Glob pattern for input files", defaults.input)
	.option("-o, --output <output>", "Output file", defaults.output)
	.option("-d, --dir <dir>", "Comma-separated list of directories to search. Cannot be used together with -i", defaults.dirs)
	.option("-t, --types <types>", "Comma-separated list of file types to search for. Cannot be used together with -i", defaults.types)
	.option("--spaces <spaces>", "Number of spaces to use for indentation. If missing or falsy, tabs are assumed.", defaults.spaces)
	.option("--verbose", "Verbose output")
	.option("--dry-run", "Do not write to file. Also enables verbose output")
	.option("--blame-out <blameOut>", "File to write the output of git blame to (mainly useful for debugging)")
	;

program.action(() => {
	const options = program.opts();
	// console.log(options);
	run(options);
});

program.parse(process.argv);