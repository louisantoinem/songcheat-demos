import { Utils, Player, waveTables } from 'songcheat-core'

// https://github.com/rollup/rollup/issues/1803/
// import $ from 'jQuery'
let $ = window.jQuery

export function PlayerUI (audioCtx, songcheat, notes, loop) {
  var self = this

  if (!notes) {
    // whole song (or selected unit)
    notes = []
    let unitIndex = 0
    for (let unit of songcheat.structure) {
      if (songcheat.showUnitIndex !== null && songcheat.showUnitIndex !== unitIndex) { unitIndex++; continue }
      for (let phrase of unit.part.phrases) {
        for (let bar of phrase.bars) {
          for (let note of bar.rhythm.compiledScore) {
            let chordedNote = JSON.parse(JSON.stringify(note))
            chordedNote.chord = bar.chords[note.placeholderIndex % bar.chords.length]
            if (!chordedNote.chord) throw new Error('No chord found for placeholder ' + (note.placeholderIndex + 1))
            notes.push(chordedNote)
          }
        }
      }
      unitIndex++
    }
  }

  // create player
  let player = new Player(audioCtx, notes, {
    loop: loop,
    capo: parseInt(songcheat.capo, 10),
    signature: songcheat.signature,
    type: songcheat.wave,
    onDone: function () { $stopLink.trigger('click') },
    onCountdown: function (c) { $countdownZone.html(c || '') }
  })

  // controls
  this.$div = $('<div>').css({ 'margin-top': '10px', 'position': 'relative' })

  let $speedMention = $('<span>').css({ 'font-size': '.9em', 'font-weight': 'bold', 'padding-left': '10px' })
  let updateSpeed = function () {
    $speedMention.html(player.getTempo() + ' bpm')
    $tempoSlider.val(player.speedpct)
  }
  let $countdownZone = $('<span>').css({ 'font-size': '4em', 'font-weight': 'normal', 'color': 'red', 'text-shadow': '4px 4px 2px rgba(200, 150, 150, 1)', 'position': 'absolute', 'top': '10px', 'right': '10px' })

  let $speed100Link = $('<a>').css({ 'padding-left': '10px' }).html('Original').on('click', function () {
    player.speed(100)
    updateSpeed()
  })

  let $playLink = $('<a>').html('&#9658;').on('click', function () {
    player.play(player.paused || loop ? 0 : 3)
    self.$div.find('.autohide').show()
    $speedMention.show()
    $playLink.hide()
  })

  let $rewindLink = $('<a>').html('&#9668;').on('click', function () {
    player.rewind()
  })

  let $pauseLink = $('<a>').html('&#10074;&#10074;').on('click', function () {
    player.pause()
    self.$div.find('.autohide').show()
    $speedMention.show()
    $pauseLink.hide()
  })

  let $stopLink = $('<a>').html('&#9724').on('click', function () {
    player.stop()
    self.$div.find('.autohide').hide()
    $speedMention.hide()
    $playLink.show()
  })

  this.$div
    .append($playLink)
    .append($pauseLink)
    .append($stopLink)
    .append($rewindLink)
    .append('&nbsp;&nbsp;')
    .append($countdownZone)
    .append('<hr class="autohide" style="clear:both; border:1px solid #ccc"/>')

  let unique = Date.now()

  // enable mode and type switch if at least one actual musical note found (with chords and strings to play)
  let musicalSwitches = false
  for (let note of notes) { if (note.chord && note.strings) { musicalSwitches = true; break } }
  if (musicalSwitches) {
    let $divMusicalSwitches = $("<div style='float:right'>")
    this.$div.append($divMusicalSwitches)

    // mode switch
    $divMusicalSwitches.append($('<div class="autohide">').css({ 'margin-top': '10px', 'display': 'block' })
      .append($('<input type="radio" name="modeswitch' + unique + '" value="' + player.MODE_CHORDS + '" checked>')).append(' Chords ')
      .append($('<input type="radio" name="modeswitch' + unique + '" value="' + player.MODE_BASS + '">')).append(' Bass only ')
      .append($('<input type="radio" name="modeswitch' + unique + '" value="' + player.MODE_RHYTHM + '">')).append(' Rhythm '))
    this.$div.find('input[name=modeswitch' + unique + ']').change(function () { player.setMode($(this).val()) })

    // type switch
    let $typeSwitch = $('<select>')
    $divMusicalSwitches.append($('<div class="autohide">').css({ 'margin-top': '15px', 'display': 'block' }).append('Wave form: ').append($typeSwitch))
    for (let type of ['sine', 'square', 'sawtooth', 'triangle']) $typeSwitch.append($('<option>').attr('selected', player.type === type).attr('value', type).text('(' + type + ')'))
    for (let instrument in waveTables) $typeSwitch.append($('<option>').attr('selected', player.type === instrument).attr('value', instrument).text(instrument))
    $typeSwitch.change(function () { player.setType($(this).val()) })

    // disto slider
    let $distoSlider = $('<input type="range" min="0" max="100" value="' + player.distortion + '" class="slider" style="margin-top: 10px">')
    // $divMusicalSwitches.append($('<div class="autohide">').css({ 'margin-top': '5px', 'display': 'block' }).append("Distortion: ").append($distoSlider));
    $distoSlider.on('input', function () { player.setDisto(parseInt($(this).val(), 10)) })
    $distoSlider.on('change', function () { player.setDisto(parseInt($(this).val(), 10)) })
  }

  // tempo slider
  let $tempoSlider = $('<input type="range" min="1" max="200" value="' + player.speedpct + '" class="slider" style="margin-top: 10px">')
  this.$div.append($('<div class="autohide">').css({ 'margin-top': '5px', 'display': 'block' }).append('Tempo: ').append($tempoSlider).append($speedMention).append($speed100Link))
  $tempoSlider.on('input', function () {
    player.speed(parseInt($(this).val(), 10))
    updateSpeed()
  })
  $tempoSlider.on('change', function () {
    player.speed(parseInt($(this).val(), 10))
    updateSpeed()
  })

  // volume slider
  let $volumeSlider = $('<input type="range" min="0" max="100" value="' + player.volume + '" class="slider" style="margin-top: 10px">')
  this.$div.append($('<div class="autohide">').css({ 'margin-top': '5px', 'display': 'block' }).append('Volume: ').append($volumeSlider))
  $volumeSlider.on('input', function () { player.setVolume(parseInt($(this).val(), 10)) })
  $volumeSlider.on('change', function () { player.setVolume(parseInt($(this).val(), 10)) })

  // allow to disable shuffle if song has a shuffle defined
  if (songcheat.signature.shuffle) {
    this.$div.append($('<div class="autohide">').css({ 'margin-top': '15px', 'display': 'block' })
      .append($('<input type="radio" name="shuffleswitch' + unique + '" value="on" checked>')).append(' Shuffle On ')
      .append($('<input type="radio" name="shuffleswitch' + unique + '" value="off">')).append(' Shuffle Off '))
    this.$div.find('input[name=shuffleswitch' + unique + ']').change(function () {
      player.shuffle = $(this).val() === 'on' ? Utils.duration(songcheat.signature.shuffle) : null
    })
  }

  this.$div.find('a').css({ 'cursor': 'pointer', 'font-size': '1em', 'margin-right': '10px' }).addClass('autohide')

  // initialize in stopped state
  updateSpeed()
  $stopLink.trigger('click')
}

PlayerUI.prototype.div = function () {
  return this.$div
}
