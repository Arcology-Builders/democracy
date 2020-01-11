import React, { Suspense, Fragment } from 'react'
import { unstable_createResource } from 'react-cache'
import { note } from 'aztec.js'
import { keccak } from 'ethereumjs-util'

const isEmptyMap = (obj) => {
  return (Object.keys(obj).length === 0)
}
const solarizedColors = [
'#b5890088', // yellow
'#cb4b1688', // orange
'#dc322f88', // red
'#d3368288', // magenta
'#6c71c488', // violet
'#268bd288', // blue
'#2aa19888', // cyan
'#85990088', // green
]

const getColor = (value) => {
  const byte = Number(keccak(value)[0])
  return solarizedColors[byte % solarizedColors.length]
}

const Fetcher = unstable_createResource((viewKey) => note.fromViewKey(viewKey))

const NoteValue = (props) => {

  const fullNoteJSON = Fetcher.read(props.noteJSON.get('viewingKey'))  
  const value = fullNoteJSON.k.toString()
  return (
    <div
      style={{ backgroundColor: getColor(value) }}
      onClick={() => props.setSelectedNote(value)}
      >
      {value}
    </div>
  )
}

export const Note = (props) =>  {

  return (
    <Fragment>
      <Suspense fallback={<div>Loading...</div>}>
        <div className="note {props.status}">
          <NoteValue
            noteJSON={props.noteJSON}
            setSelectedNote={props.setSelectedNote}
          />
        </div>
      </Suspense>
    </Fragment>
  )

}
