const commandLineArgs = require('command-line-args')
const getUsage = require('command-line-usage')
let { Utils, Mode, Scale } = require('songcheat-core')

// https://apprendre-le-home-studio.fr/bien-demarrer-ta-composition-46-suites-daccords-danthologie-a-tester-absolument-11-idees-de-variations/

let KEYNOTES = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B', 'Cb' ]

let MODES = {
  Major: new Mode([2, 2, 1, 2, 2, 2, 1], ['', 'm', 'm', '', '', 'm', '°']), // Mode Ionien, Mode de Do, "Gamme" Majeure
  Minor: new Mode([2, 1, 2, 2, 1, 2, 2], ['m', '°', '', 'm', 'm', '', '']) // Mode Eolien, Mode de La, "Gamme" Mineure naturelle
}

// En "Relief fort" et "Tension", l’accord Vm est remplacé par V pour renforcer le relief harmonique
let MinorStrong = new Mode([2, 1, 2, 2, 1, 2, 2], ['m', '°', '', 'm', '', '', ''])

let DICT = {
  Major: {},
  Minor: {}
}

DICT['Major']['Relief faible (Verse, Bridge)'] = [
  [1, 1, 3, 3],
  [1, 1, 6, 6],
  [1, 6, 3, 1]
]

DICT['Major']['Relief moyen (Verse, Bridge, Chorus)'] = [
  [1, 5, 6, 4], // "Magic chords"
  [1, 3, 6, 4],
  [1, 2, 3, 4],
  [1, 1, 5, 4],
  [1, 1, 4, 4]
]

DICT['Major']['Tension (Pre-Chorus)'] = [
  [4, 2, 1, 5],
  [4, 4, 5, 5],
  [4, 5, 2, 5]
]

DICT['Major']['Relief fort (Chorus)'] = [
  [1, 4, 6, 5],
  [1, 6, 4, 5],
  [1, 5, 4, 5],
  [1, 5, 6, 5],
  [1, 1, 4, 5],
  [1, 4, 2, 5],
  [1, 4, 1, 5],
  [1, 3, 4, 5],
  [1, 2, 3, 5],
  [1, 1, 5, 5],
  [1, 6, 2, 5]
]

DICT['Minor']['Relief faible (Verse, Bridge)'] = [
  [1, 1, 6, 6],
  [1, 1, 3, 3],
  [1, 6, 1, 3]
]

DICT['Minor']['Relief moyen (Verse, Bridge, Chorus)'] = [
  [1, 3, 7, 4],
  [1, 5, 3, 4],
  [1, 7, 4, 4],
  [1, 1, 4, 4],
  [1, 3, 6, 4]
]

DICT['Minor']['Tension (Pre-Chorus)'] = [
  [6, 6, 5, 5],
  [4, 4, 5, 5],
  [6, 5, 6, 5]
]

DICT['Minor']['Relief fort (Chorus)'] = [
  [1, 3, 4, 5],
  [1, 5, 4, 5],
  [1, 7, 6, 5],
  [1, 1, 4, 5],
  [1, 4, 1, 5],
  [1, 6, 4, 5],
  [1, 2, 3, 5],
  [1, 1, 5, 5],
  [1, 7, 4, 5],
  [1, 4, 6, 5],
  [1, 1, 6, 5],
  [1, 6, 3, 5],
  [1, 4, 7, 5]
]

// // keep only one random sample for each mode and type
// for (let majmin in MODES) for (let type in DICT[majmin]) DICT[majmin][type] = Utils.shuffle(DICT[majmin][type])[0]

const optionDefinitions = [
  { name: 'help', alias: 'h', type: Boolean, description: 'Print this usage guide.' },
  { name: 'key', alias: 'k', type: String, typeLabel: '[underline]{key}', defaultOption: true, description: 'The key (this is the default option).' }
]

const options = commandLineArgs(optionDefinitions)

if (options['help'] || !options['key']) {
  const sections = [
    {
      header: 'Chord progression generator',
      content: [
        'Generates possible chord progressions for each song part.',
        'Keys: ' + KEYNOTES + ' followed by \'m\' if Minor.',
        'Use ? or ?m to have a random key chosen for you.'
      ]
    },
    {
      header: 'Synopsis',
      content: [
        '$ node cpg [--key] [underline]{key} ...'
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

let mode = 'Major'
let keynote = options['key'].replace('?', Utils.shuffle(KEYNOTES)[0])

if (keynote[keynote.length - 1] === 'm') {
  mode = 'Minor'
  keynote = keynote.substr(0, keynote.length - 1)
}

if (!KEYNOTES.includes(keynote)) {
  console.warn(`Invalid keynote ${keynote}, must be one of ${KEYNOTES}`)
  process.exit(-1)
}

console.log(Utils.title(`${keynote} ${mode} : ${MODES[mode].degrees()} = ${new Scale(MODES[mode], keynote).chords()} `))
for (let type in DICT[mode]) {
  console.log(`${type} :`)
  let counter = 0
  for (let degrees of DICT[mode][type]) {
    counter++
    let mode_ = MODES[mode]
    // En "Relief fort" et "Tension", l’accord Vm est remplacé par V pour renforcer le relief harmonique
    if (mode === 'Minor' && type.indexOf('moyen') < 0 && type.indexOf('faible') < 0) mode_ = MinorStrong
    let scale = new Scale(mode_, keynote)
    console.log(`${counter}. ${mode_.degrees(degrees)} = ${scale.chords(degrees)}`)
  }
  console.log('---------')
}
console.log('')
