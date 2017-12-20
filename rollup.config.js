import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import json from 'rollup-plugin-json'

import pkg from './package.json'

var BANNER = '/**\n' +
  ' * SongCheat Viewer ' + pkg.version + ' built on ' + new Date().toISOString() + '.\n ' +
  ' * Copyright (c) 2017 Louis Antoine <louisantoinem@gmail.com>\n' +
  ' *\n' +
  ' * http://www.songcheat.io  http://github.com/louisantoinem/songcheat-viewer\n' +
  ' */\n'

export default [
  {
    input: 'index.js',
    sourcemap: true,
    banner: BANNER,
    output: [{
      file: 'dist/songcheat-viewer.esm.js',
      format: 'es'
    },
    {
      file: 'dist/songcheat-viewer.umd.js',
      format: 'umd'
    }
    ],
    name: 'songcheatVexTab',
    plugins: [
      resolve({}),
      commonjs({}),
      json({})
    ]
  }
]
