import { Utils, Compiler, Ascii, ChordPix, VexTab as SongcheatVexTab } from 'songcheat-core'
import { PlayerUI } from './player_ui'
import samples from '../dist/samples.json'

// create audio context
let audioCtx = new (window.AudioContext || window.webkitAudioContext || window.audioContext)()

// https://github.com/rollup/rollup/issues/1803/
// import $ from 'jQuery'
let $ = window.jQuery

// https://github.com/rollup/rollup/issues/1803/
// import { VexTab, Artist, Vex } from 'vextab'
let VexTab = window.VexTab
let Artist = window.Artist
let Vex = window.Vex

let DEBUG = 0
let localStorage = window.localStorage
let compiler = new Compiler(DEBUG)

Artist.NOLOGO = true

function addEvent (elem, event, fn) {
  if (elem.addEventListener) return elem.addEventListener(event, fn, false)
  elem.attachEvent('on' + event, function () { return (fn.call(elem, window.event)) })
}

function onChange (elem, fn, data) {
  var priorValue = elem.value

  function checkNotify (e, delay) {
    // notify if actually changed
    if (elem.value !== priorValue) {
      priorValue = elem.value
      fn.call(this, e, data)
    } else {
      // the actual data change happens after some events so we queue a check
      if (delay) setTimeout(function () { checkNotify(e, false) }, 0)
    }
  }

  var events = ['keyup', false, 'blur', false, /* "focus", false, */ 'drop', true, 'change', false, 'input', false, 'paste', true, 'cut', true, 'copy', true]
  for (let i = 0; i < events.length; i += 2) addEvent(elem, events[i], function (e) { checkNotify.call(this, e, events[i + 1]) })
}

function go (song, songcheat) {
  let data = { 'song': song, 'debug': DEBUG }
  for (let p of ['mode', 'lyricsMode', 'showUnit', 'maxsp', 'barsPerLine', 'splitUnits', 'splitParts', 'partdisplay']) data[p] = songcheat[p]
  window.location.href = 'viewer.html?' + Utils.encodeQueryData(data)
}

function songcheat (songcheat, $divScore, $divChords, $divParts, $divStructure, $divLyrics, $divRhythms, scoreWidth, chordWidth, rhythmsWidth) {
  var get = new window.URLSearchParams(window.location.search)
  DEBUG = parseInt(get.get('debug'), 10) || DEBUG // debug level

  scoreWidth = scoreWidth || 800
  chordWidth = chordWidth || 250

  let canvas = $divScore[0]
  canvas.getContext('2d')

  // default values for mode, bars per line and scale
  songcheat.scale = songcheat.scale || 0.92
  songcheat.mode = songcheat.mode || 'nt'
  songcheat.lyricsMode = songcheat.lyricsMode || 's'
  songcheat.showUnit = songcheat.showUnit || '*'
  songcheat.barsPerLine = songcheat.barsPerLine || 4
  songcheat.maxsp = typeof songcheat.maxsp === 'undefined' ? 1 : songcheat.maxsp
  songcheat.splitUnits = typeof songcheat.splitUnits === 'undefined' ? 0 : songcheat.splitUnits
  songcheat.splitParts = typeof songcheat.splitParts === 'undefined' ? 4 : songcheat.splitParts
  songcheat.partdisplay = songcheat.partdisplay || 'compact'

  // settings that may be forced in GET
  songcheat.mode = get.get('mode') || songcheat.mode
  songcheat.lyricsMode = get.get('lyricsMode') || songcheat.lyricsMode
  songcheat.showUnit = get.get('showUnit') || songcheat.showUnit
  songcheat.barsPerLine = get.get('barsPerLine') ? parseInt(get.get('barsPerLine'), 10) : songcheat.barsPerLine
  songcheat.maxsp = get.get('maxsp') ? parseInt(get.get('maxsp'), 10) : songcheat.maxsp
  songcheat.splitUnits = get.get('splitUnits') ? parseInt(get.get('splitUnits'), 10) : songcheat.splitUnits
  songcheat.splitParts = get.get('splitParts') ? parseInt(get.get('splitParts'), 10) : songcheat.splitParts
  songcheat.partdisplay = get.get('partdisplay') || songcheat.partdisplay

  // ensure showUnit is within the bounds
  songcheat.showUnitIndex = songcheat.showUnit === '*' ? null : Math.min(songcheat.structure.length - 1, parseInt(songcheat.showUnit, 10))
  if (songcheat.showUnitIndex < 0) songcheat.showUnitIndex = null
  songcheat.showUnit = songcheat.showUnitIndex !== null ? songcheat.showUnitIndex : '*'

  // compile
  try {
    songcheat = compiler.compile(songcheat)
  } catch (e) {
    $divScore.parent().append($('<p>').html(e.message).css('color', 'red'))
    console.error(e)
    return false
  }

  // links to other songs
  $('a[rel]').click(function () {
    go(parseInt($(this).attr('rel'), 10) + 1, songcheat)
  })

  // build unit select
  let unitIndex = 0
  for (let unit of songcheat.structure) $('select[name=showUnit]').append($('<option>').val(unitIndex++).text(unit.name))

  // for each user controlled setting
  $('select').each(function () {
    // initialize
    $(this).val(songcheat[$(this).attr('name')])

    // reload on change
    $(this).change(function () {
      songcheat[$(this).attr('name')] = $(this).val()
      go(window.scIndex + 1, songcheat)
    })
  })

  // shuffle
  if (songcheat.signature.shuffle) {
    $('#left h3:first').append($('<span>').html('<br/>Shuffle ' + (songcheat.signature.shuffle === ':4' ? 'quarter notes' : songcheat.signature.shuffle.substr(1) + 'th notes')))
  }

  // shuffle 8th image
  if (songcheat.signature.shuffle === ':8') {
    $('#left h3:first').append($('<img>').css({ 'padding-left': '50px', 'width': '100px', 'display': 'inline', 'vertical-align': 'bottom' }).attr('src', '../img/shuffle_8th.svg'))
  }

  // chord diagrams
  for (let chord of songcheat.chords) {
    var url = DEBUG ? '../img/missing_diagram.png' : ChordPix.url(chord, chordWidth)
    let $cDiv = $('<div>').css({ 'display': 'inline-block', 'vertical-align': 'top' })
    $divChords.append($cDiv)
    $cDiv.append($('<img>').attr('src', url).attr('title', chord.comment).css({ 'display': 'block' /* removes whitespace below image */, 'width': chordWidth + 'px' }))
    $cDiv.append($('<p>').css({ 'width': chordWidth + 'px', 'font-size': '0.85em', 'text-align': 'center', 'margin-top': '0px' }).html(chord.comment))
  }

  //  ascii parts
  for (let part of songcheat.parts) {
    if (part.sub) continue
    let $divPart = $('<div>').css({ 'color': part.color })
    let $partsZone = $('<p>')
    $divPart.append($('<p>').css({ 'font-weight': 'bold', 'text-decoration': 'normal', 'margin-bottom': '0px' }).html(part.name))
    $divPart.append($partsZone)
    $divParts.append($divPart)
    displayParts(songcheat, part, $partsZone)
  }

  //  ascii structure
  for (let unit of songcheat.structure) {
    $divStructure.append($('<p>').css({ 'font-weight': 'bold', 'margin': '5px 0px', 'color': unit.part.color }).html('[' + unit.name + ']'))
  }

  //  ascii lyrics
  for (let unit of songcheat.structure) {
    // load from local storage
    let lskey = 'SongCheatLyrics.' + songcheat.id + '.unit.' + unit.name
    unit.lyrics = localStorage.getItem(lskey) || unit.lyrics

    // view zone
    let $divUnit = $('<div>').css({ 'color': unit.part.color })
    let $editLink = $('<a>').html('Edit').css('text-decoration', 'underline').css('cursor', 'pointer').css('font-size', '0.75em').css('float', 'right').css('margin-right', '10px')
    let $lyricsZone = $('<p>').css('line-height', '150%')
    $divUnit.append($('<p>').css({ 'font-weight': 'bold', 'text-decoration': 'normal', 'margin-bottom': '2px', 'margin-top': '35px' }).html('[' + unit.name + '] ').append($editLink))
    $divUnit.append($lyricsZone)
    $divLyrics.append($divUnit)
    displayLyrics(songcheat, unit, $lyricsZone)

    // hidden edit zone
    let $divUnitEdit = $('<div>')
    let $closeLink = $('<a>').html('Close').css('text-decoration', 'underline').css('cursor', 'pointer')
    $divUnitEdit.append($('<textarea>').css('font-size', '1em').css('width', '400px').css('height', '200px'))
    $divUnitEdit.append('<br/>').append($closeLink)
    $divLyrics.append($divUnitEdit.hide())

    // save lyrics and update ui
    let saveAndUpdate = function (updateVextab) {
      // save to local storage
      unit.lyrics = $(this).val()
      localStorage.setItem(lskey, unit.lyrics)

      // re-display ascii
      displayLyrics(songcheat, unit, $lyricsZone)

      if (updateVextab) {
        // recreate canvas
        let $canvas = $('<canvas>')
        $(canvas).after($canvas).remove()
        canvas = $canvas[0]

        // reload vextab score
        let renderer = new Vex.Flow.Renderer(canvas, Vex.Flow.Renderer.Backends.CANVAS)
        let artist = new Artist(10, 10, scoreWidth, { scale: songcheat.scale })
        let vextab = new VexTab(artist)
        console.info('Parsing score...')
        let units = typeof songcheat.showUnitIndex === 'undefined' || songcheat.showUnitIndex === null ? songcheat.structure : [songcheat.structure[songcheat.showUnitIndex]]
        vextab.parse(SongcheatVexTab.Units2VexTab(songcheat, units, songcheat.barsPerLine, false, songcheat.lyricsMode === 's', songcheat.lyricsMode === 'h'))
        console.info('Rendering score...')
        artist.render(renderer)
        console.info('Score done!')
      }
    }

    // edit action
    $editLink.on('click', function () {
      $divUnit.find('p:last') // .hide();
      $divUnitEdit.show().find('textarea').val(unit.lyrics).focus()
    })

    // close action
    $closeLink.on('click', function () {
      $divUnitEdit.hide()
      saveAndUpdate.call($divUnitEdit.find('textarea')[0], true)
    })

    // auto-save
    onChange($divUnitEdit.find('textarea')[0], function (e) {
      console.log('Auto saving on event ' + e.type)
      saveAndUpdate.call(this, true)
    })
  }

  // parse and render rhythms with vextab
  for (let rhythm of songcheat.rhythms) {
    let $divRhythm = $('<div>')
    $divRhythms.append($divRhythm)

    // player controls
    $divRhythm.before(new PlayerUI(audioCtx, songcheat, [compiler.getRhythmUnit(songcheat, rhythm)], true).div())

    // warning if not a whole number of bars
    if (!rhythm.score.length.bar()) {
      let warning = 'Rhythm ' + rhythm.name + ' is currently equivalent to ' + rhythm.score.length + '. A rhythm unit should be equivalent to a whole number of bars (' + songcheat.bar + ').'
      $divRhythm.before($('<p>').addClass('warning').css('color', 'orange').html('Warning: ' + warning))
    }

    try {
      console.info('Converting rhythm to vextab score...')
      let score = SongcheatVexTab.Rhythm2VexTab(songcheat, rhythm)
      console.info('Parsing score...')
      let artist = new Artist(10, 10, rhythmsWidth, { scale: 1.0 })
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

    // player controls
  $(canvas).before(new PlayerUI(audioCtx, songcheat).div())

    // parse and render full song score with vextab
  try {
    console.info('Converting songcheat to vextab score...')
    let units = typeof songcheat.showUnitIndex === 'undefined' || songcheat.showUnitIndex === null ? songcheat.structure : [songcheat.structure[songcheat.showUnitIndex]]
    let score = SongcheatVexTab.Units2VexTab(songcheat, units, songcheat.barsPerLine, false, songcheat.lyricsMode === 's', songcheat.lyricsMode === 'h')
    console.info('Parsing score...')
    let artist = new Artist(10, 10, scoreWidth, { scale: songcheat.scale })
    let vextab = new VexTab(artist)
    vextab.parse(score)
    console.info('Rendering score...')
    artist.render(new Vex.Flow.Renderer(canvas, Vex.Flow.Renderer.Backends.CANVAS))
    console.info('Score done!')
  } catch (e) {
    $divScore.parent().append($('<p>').html(e.message).css('color', 'red'))
    console.error(e)
  }
}

function displayParts (songcheat, part, $partsZone) {
  // clear eveyrthing
  $partsZone.parent().find('p.warning,p.error').remove()
  $partsZone.html('')

  try {
    // if compact part display enabled, set maxsp = 1
    // if full part display enabled, force maxsp = 0: we want the exact position of chords
    // always split by N bars (no lyrics so split as entered makes no sense, splitParts is never 0)
    // we can use chord changes mode "rhythm", "bar" or "phrase", use "rhythm" as for vextab
    let ascii = new Ascii(songcheat, DEBUG)
    $partsZone.append(ascii.getPartText(part, songcheat.partdisplay === 'compact' ? 1 : 0, songcheat.splitParts, false))
  } catch (e) {
    // display fatal error while parsing or building lyrics
    $partsZone.before($('<p>').addClass('error').css('color', 'red').html('Error: ' + e.message))
    console.error(e)
  }
}

function displayLyrics (songcheat, unit, $lyricsZone) {
  // clear eveyrthing
  $lyricsZone.parent().find('p.warning,p.error').remove()
  $lyricsZone.html('')

  try {
    let ascii = new Ascii(songcheat, DEBUG)

    // display lyrics warnings if any
    for (let warning of unit.lyricsWarnings) {
      $lyricsZone.before($('<p>').addClass('warning').css('color', 'orange').html('Warning: ' + warning))
      console.warn('[' + unit.name + '] ' + warning)
    }

    // build and display ascii lyrics
    $lyricsZone.append(ascii.getUnitText(unit, songcheat.maxsp, songcheat.splitUnits, songcheat.maxsp !== 1))
  } catch (e) {
    // display fatal error while parsing or building lyrics
    $lyricsZone.before($('<p>').addClass('error').css('color', 'red').html('Error: ' + e.message))
    console.error(e)
  }
}

var get = new window.URLSearchParams(window.location.search)
let scIndex = window.scIndex = (parseInt(get.get('song'), 10) || 1) - 1
let sc = samples[scIndex]
sc.id = scIndex + 1 // simulate a mongodb id for saving lyrics

document.title = sc.title + ' | ' + document.title
$('#left h1').html(sc.title)
$('#left h2').html(sc.artist + ', ' + sc.year)
$('#left h3.tempo').html('Tempo: ' + sc.signature.tempo + ' bpm')
$('#left p').html(sc.comment)

$('#left h3.capo').html('Capo: ' + (sc.capo > 0 ? sc.capo : 'n/a'))
$('#left h3.tuning').html('Tuning: ' + sc.tuning)

$('#middle h4, #right h4').css('text-decoration', 'underline').css('font-size', '1.1em').css('margin', '0.5em 0em')

let barsPerLine = get.get('barsPerLine') ? parseInt(get.get('barsPerLine'), 10) : (sc.barsPerLine || 4)
let naturalSize = $(window).width() * 0.45
let absMinSize = 640
let minSize = Math.max(barsPerLine * 300, absMinSize)
let maxSize = Math.max(barsPerLine * 450, absMinSize)
var scoreWidth = Math.min(maxSize, Math.max(minSize, naturalSize))
var rhythmWidth = Math.min(750, Math.max(400, $(window).width() * 0.24))
$('#right').css('width', scoreWidth + 'px')

var _scIndex = 0
for (var sc_ of samples) {
  /* if (_scIndex != scIndex) */
  $('#links').append($("<a style='font-size: 0.9em; color: black; cursor: pointer; text-decoration:underline'>").attr('rel', _scIndex).html(sc_.title + ' (' + sc_.artist + ', ' + sc_.year + ')')).append('<br/>')
  _scIndex++
}

songcheat(sc, $('#score'), $('#chords'), $('#parts'), $('#structure'), $('#lyrics'), $('#rhythms'), scoreWidth, 175, rhythmWidth)
$('body').show()
