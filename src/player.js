import { Compiler, Player, Score } from 'songcheat-core'
import samples from '../dist/samples.json'

// https://github.com/rollup/rollup/issues/1803/
// import $ from 'jQuery'
let $ = window.jQuery

// create audio context
let audioCtx = new (window.AudioContext || window.webkitAudioContext || window.audioContext)()

// get a random sample songcheat and compile it
let sample = samples[Math.floor(Math.random() * samples.length)]
let compiler = new Compiler(0)
let songcheat = compiler.compile(sample)
$('body>h1').html(`${songcheat.title} (${songcheat.artist}, ${songcheat.year})`)

// concat score of all units in song
let score = new Score(songcheat.signature.time)
for (let unit of songcheat.structure) score.append(unit.part.score)

// play
let player = new Player(audioCtx, score, {
  loop: false,
  capo: parseInt(songcheat.capo, 10),
  signature: songcheat.signature,
  type: songcheat.wave
})

// control player
$('#pause').on('click', function () {
  player.pause()
  $('#pause').hide()
  $('#play').show()
})

$('#play').show().on('click', function () {
  player.play()
  $('#pause').show()
  $('#play').hide()
})
