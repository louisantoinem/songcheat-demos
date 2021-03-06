import { ChordPix, Compiler } from 'songcheat-core'
import samples from '../dist/samples.json'

// https://github.com/rollup/rollup/issues/1803/
// import $ from 'jQuery'
let $ = window.jQuery

// get a random sample songcheat and compile it
let sample = samples[Math.floor(Math.random() * samples.length)]
let compiler = new Compiler(0)
let songcheat = compiler.compile(sample)
$('body>h1').html(`${songcheat.title} (${songcheat.artist}, ${songcheat.year})`)

// display chord diagrams
for (let chord of songcheat.chords) {
  var url = ChordPix.url(chord, 200)
  console.info(url)
  $('body>div').append(
    $('<div>')
      .css({ 'display': 'inline-block', 'vertical-align': 'top' })
      .append($('<img>').attr('src', url))
  )
}
