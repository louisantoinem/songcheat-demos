import { Compiler, VexTab as SongcheatVexTab } from 'songcheat-core'
import samples from '../dist/samples.json'

// https://github.com/rollup/rollup/issues/1803/
// import $ from 'jQuery'
let $ = window.jQuery

// https://github.com/rollup/rollup/issues/1803/
// import { VexTab, Artist, Vex } from 'vextab'
let VexTab = window.VexTab
let Artist = window.Artist
let Vex = window.Vex

Artist.NOLOGO = true

// get a random sample songcheat and compile it
let sample = samples[Math.floor(Math.random() * samples.length)]
let compiler = new Compiler(0)
let songcheat = compiler.compile(sample)
$('body>h1').html(`${songcheat.title} (${songcheat.artist}, ${songcheat.year})`)

// show lyrics warnings if any
for (let unit of songcheat.structure) {
  if (unit.lyricsWarnings.length > 0) $('body').append($('<p>').html('Parse warnings for unit ' + unit.name + ':\n - ' + unit.lyricsWarnings.join('\n- ')).css('color', 'red'))
}

// parse and render rhythms with vextab
for (let rhythm of songcheat.rhythms) {
  let $divRhythm = $('<div>')
  $('canvas').before($divRhythm)

  try {
    console.info('Converting rhythm to vextab score...')
    let score = SongcheatVexTab.Rhythm2VexTab(songcheat, rhythm)
    console.info('Parsing score...')
    let artist = new Artist(10, 10, 600, { scale: 1.0 })
    let vextab = new VexTab(artist)
    vextab.parse(score)
    console.info('Rendering score...')
    artist.render(new Vex.Flow.Renderer($divRhythm[0], Vex.Flow.Renderer.Backends.SVG))
    console.info('Score done!')
  } catch (e) {
    $divRhythm.html(e.message).css('color', 'red')
    console.error(e)
  }
}

// parse and render full song score with vextab
try {
  console.info('Converting songcheat to vextab score...')
  let score = SongcheatVexTab.Songcheat2VexTab(songcheat)
  console.info('Parsing score...')
  let artist = new Artist(10, 10, 1200, {scale: 1.0})
  let vextab = new VexTab(artist)
  vextab.parse(score)
  console.info('Rendering score...')
  artist.render(new Vex.Flow.Renderer($('canvas')[0], Vex.Flow.Renderer.Backends.CANVAS))
  console.info('Score done!')
} catch (e) {
  $('body').append($('<p>').html(e.message).css('color', 'red'))
  console.error(e)
}
