import React, { createContext, useContext, useState, useEffect } from 'react'

import { useRuntime } from 'A0/state'
import { Annotator } from 'A0/ui/annotator'


const AnnotationContext = createContext()

export const useAnnotations = () => {
  const ctx = useContext(AnnotationContext)
  if (ctx === undefined) {
    throw new Error(`AnnotationContext must be invoked in a child component of AnnotationProvider`)
  }
  return ctx
}

export const AnnotationProvider = props => {
  const { symbols }                   = useRuntime()
  const [ annotation, setAnnotation ] = useState(null)
  const [ annotator ]                 = useState(new Annotator({ symbols, setAnnotation }))

  const context = {
    annotator,
    annotation,
  }
  
  return (
    <AnnotationContext.Provider value={context}>
      {props.children}
    </AnnotationContext.Provider>
  )
}

// export const AnnotationProvider = props => {
//   const [currentThing, setCurrentAnnotation] = useState(null)
//   const [currentAnnotation, setCurrentThing] = useState(null)
//   const [subscription, setSubscription] = useState(null)

//   useEffect(() => {
//     if (currentThing === null) {
//       setCurrentThing(null)
//       return
//     }
//     const { token, symbol } = currentThing
//     setCurrentThing({token, symbol: symbol === null ? null : symbol.symbol}) // wow...

//     if (symbol === null) return
    
//     if (symbol.updates !== null) {
//       if (subscription !== null) subscription.unsubscribe()
//       setSubscription(
//         symbol.updates.subscribe(s => setCurrentThing({token, symbol:s}))
//       )
//     }

//   }, [currentThing])
  
//   const context = {
//     currentAnnotation,
//     setCurrentAnnotation,
//   }
  
//   return (
//     <AnnotationContext.Provider value={context}>
//       {props.children}
//     </AnnotationContext.Provider>
//   )
// }
