import { FirstPassParser } from './firstPass'
import { SecondPassParser } from './secondPass'


export class Parser {
  constructor(symbolTable) {
    this.firstPassParser  = new FirstPassParser(symbolTable)
    this.secondPassParser = new SecondPassParser(symbolTable)
  }

  firstPass(tokens, blockKey, blockIndex) {
    return this.firstPassParser.analyze(tokens, blockKey, blockIndex)
  }

  secondPass() {
    // something.
  }
}