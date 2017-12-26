import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import json from 'rollup-plugin-json'

import pkg from './package.json'

var BANNER = '/**\n' +
  ' * SongCheat Viewer ' + pkg.version + ' built on ' + new Date().toString() + '.\n ' +
  ' * Copyright (c) 2017 Louis Antoine <louisantoinem@gmail.com>\n' +
  ' *\n' +
  ' * http://www.songcheat.io  http://github.com/louisantoinem/songcheat-viewer\n' +
  ' */\n'

export default [{
  input: 'src/viewer.js',
  sourcemap: true,
  banner: BANNER,
  output: [{
    file: 'dist/viewer.esm.js',
    format: 'es'
  },
  {
    file: 'dist/viewer.umd.js',
    format: 'umd'
  }
  ],
  name: 'songcheatVexTab',
  plugins: [
    resolve({}),
    commonjs({}),
    json({})
  ]
},
{
  input: 'src/vextab.js',
  sourcemap: true,
  banner: BANNER,
  output: [{
    file: 'dist/vextab.esm.js',
    format: 'es'
  },
  {
    file: 'dist/vextab.umd.js',
    format: 'umd'
  }
  ],
  external: ['jQuery'],
  globals: { 'jQuery': '$' },
  plugins: [
    resolve({}),
    commonjs({}),
    json({})
  ]
},
{
  input: 'src/chords.js',
  sourcemap: true,
  banner: BANNER,
  output: [{
    file: 'dist/chords.esm.js',
    format: 'es'
  },
  {
    file: 'dist/chords.umd.js',
    format: 'umd'
  }
  ],
  external: ['jQuery'],
  globals: { 'jQuery': '$' },
  plugins: [
    resolve({}),
    commonjs({}),
    json({})
  ]
},
{
  input: 'src/player.js',
  sourcemap: true,
  banner: BANNER,
  output: [{
    file: 'dist/player.esm.js',
    format: 'es'
  },
  {
    file: 'dist/player.umd.js',
    format: 'umd'
  }
  ],
  external: ['jQuery'],
  globals: { 'jQuery': '$' },
  plugins: [
    resolve({}),
    commonjs({}),
    json({})
  ]
}]
