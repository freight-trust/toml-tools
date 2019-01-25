const Benchmark = require("benchmark");
const _ = require("lodash");
const fs = require("fs");
const path = require("path");
const klawSync = require("klaw-sync");
const tomlToolsParse = require("../").parse;
const iarnaTomlParse = require("@iarna/toml").parse;

// Processing the input samples **before** the benchmark
const samplesDir = path.join(__dirname, "./samples/");
const allSampleFiles = klawSync(samplesDir);
const tomlSampleFiles = _.filter(allSampleFiles, fileDesc =>
  fileDesc.path.endsWith(".toml")
);
const relTomlFilesPaths = _.map(tomlSampleFiles, fileDesc =>
  path.relative(__dirname, fileDesc.path)
);
const tomlFilesContents = _.map(tomlSampleFiles, fileDesc =>
  fs.readFileSync(fileDesc.path, "utf8")
);
const samplesRelPathToContent = _.zipObject(
  relTomlFilesPaths,
  tomlFilesContents
);

function newSuite(name) {
  return new Benchmark.Suite(name, {
    onStart: () => console.log(`\n\n${name}`),
    onCycle: event => console.log(String(event.target)),
    onComplete: function() {
      console.log("Fastest is " + this.filter("fastest").map("name"));
    }
  });
}

function bench(parseFunc) {
  _.forEach(samplesRelPathToContent, tomlContent => {
    parseFunc(tomlContent);
  });
}

// This is not a very meaningful benchmark
// There are different data structures being outputted here.
// - The Chevrotain based "@toml-tools/parser" output a Concrete Syntax Tree
//   - This is a large data structure with many arrays and maps that represents the actual Syntax.
// - Other Toml parsers used here will output an AST (JS/JSON object) that would include transformations on the data
//   - Date JS objects from Toml Date literals.
//   - Trimming whitespace in multiline strings.
//   - Converting binary/Hex decimals to JS numbers
//
// So it is hard to compare...
// Normally building an AST from a Chevrotain CST is a minor thing performance wise
// So
newSuite("Real World TOML samples Benchmark")
  .add("Toml-Tools", () => bench(tomlToolsParse))
  .add("@iarna/toml", () => bench(iarnaTomlParse))
  .run({
    async: false,
    minSamples: 200
  });
