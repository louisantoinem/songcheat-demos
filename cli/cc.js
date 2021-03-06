const { Utils, Parser, ParserException, Compiler, CompilerException, Ascii, AsciiException } = require('songcheat-core')
const { promisify } = require('util')
const fs = require('fs')
const readFile = promisify(fs.readFile)
const stringify = require('json-stringify-pretty-compact')
const commandLineArgs = require('command-line-args')
const getUsage = require('command-line-usage')

const optionDefinitions = [
  { name: 'help', alias: 'h', type: Boolean, description: 'Print this usage guide.' },
  { name: 'input', alias: 'i', type: String, multiple: true, typeLabel: '[underline]{file1} [underline]{file2} ...', defaultOption: true, description: 'The input songcheat text files to process (this is the default option).' },
  { name: 'output', alias: 'o', type: String, typeLabel: '[underline]{file}', description: 'Optional output JSON file that will contain all parsed songcheats.' }
]

const options = commandLineArgs(optionDefinitions)

if (options['help'] || !options['input']) {
  const sections = [
    {
      header: 'Songcheat parser and compiler',
      content: [
        'Takes one or several songcheat text files.',
        '- Parser generates a .json file next to each input file',
        '- Compiler generates .log and .ascii files next to each input file'
      ]
    },
    {
      header: 'Synopsis',
      content: [
        '$ node cc.js [--output [underline]{file}] [--input] [underline]{file1} [underline]{file2} ...'
      ]
    },
    {
      header: 'Options',
      optionList: optionDefinitions
    }
  ]
  console.warn(getUsage(sections))
  process.exit(-1)
}

// capture console.log
var log = []
console.log = function () {
  for (let a of arguments) log.push(a.toString())
}

// create parser and compiler
let parser = new Parser()
let compiler = new Compiler(1);

(async function () {
  const samples = []

  // for each file: load then compile
  for (const file of options['input']) {
    try {
      // reset log
      log = []

      // parse source and write JSON file
      const source = await readFile(file, 'utf8')
      let songcheat = parser.parse(source)
      samples.push(songcheat)
      fs.writeFileSync(file.replace(/(\.[^.]*)$/, '$1') + '.json', stringify(songcheat))
      console.info('[' + file + '] JSON file written successfully')

      // compile songcheat
      songcheat = compiler.compile(songcheat)
      let ascii = new Ascii(songcheat, 1)

      // show lyrics warnings if any
      let texts = []
      for (let unit of songcheat.structure) {
        if (unit.lyricsWarnings.length > 0) texts.push('Parse warnings for unit ' + unit.name + ':\n- ' + unit.lyricsWarnings.join('\n- '))
      }

      // get ascii text in various styles
      texts.push(Utils.title('Split as entered / Compact'))
      for (let unit of songcheat.structure) texts.push('[' + unit.name + ']', ascii.getUnitText(unit, 1, 0, false))
      texts.push(Utils.title('Split as entered / Respect durations'))
      for (let unit of songcheat.structure) texts.push('[' + unit.name + ']', ascii.getUnitText(unit, 0, 0, true))
      texts.push(Utils.title('Split by 2 bars / Compact'))
      for (let unit of songcheat.structure) texts.push('[' + unit.name + ']', ascii.getUnitText(unit, 1, 2, false))
      texts.push(Utils.title('Split by 2 bars / Respect durations'))
      for (let unit of songcheat.structure) texts.push('[' + unit.name + ']', ascii.getUnitText(unit, 0, 2, true))

      fs.writeFileSync(file.replace(/(\.[^.]*)$/, '$1') + '.ascii', texts.join('\n\n'))
      console.info('[' + file + '] ASCII file written successfully')

      fs.writeFileSync(file.replace(/(\.[^.]*)$/, '$1') + '.log', log.join('\n'))
      console.info('[' + file + '] LOG file written successfully')
    } catch (e) {
      console.error('[' + file + '] ' + e.toString())
      if (!(e instanceof ParserException) && !(e instanceof CompilerException) && !(e instanceof AsciiException)) console.error(e)
    }
  }

  // write samples JSON to output file (or stdout)
  if (options['output']) {
    fs.writeFileSync(options['output'], stringify(samples))
    console.info(options['output'] + ' written successfully')
  } else console.info('No output file specified')
})()
