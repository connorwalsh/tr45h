import { map } from 'lodash'

import { Scheduler } from '../scheduler'

import { Lexer } from './lexer'
import { Parser } from './parser'
import { SymbolTable } from './symbols'


/**
 * the Interpreter is the main orchestrator for text analysis and evaluation.
 *
 * @description the interpreter orchestrates and delegates particular tasks to a
 * variety of subsystems: lexer, parser, symbol table, scheduler. Additionally, the
 * interpreter communicates bidirectionally with the text editor itself, both recieving
 * text to interpret and transmitting information about syntax highlighting.
 */
export class Interpreter {
  constructor() {
    this.symbols = new SymbolTable()
    this.lexer = new Lexer()
    this.parser = new Parser(this.symbols)
    this.text = null
    this.ast = null // TODO initialize an empty AST

    this.scheduler = new Scheduler(this.ast, this.symbols, 80)
    this.scheduler.start()
  }

  /**
   * analyze takes a new text state and updates the AST.
   *
   * @description
   *
   * TODO 
   * QUESTION: 
   * how can we design this in the naive approach (reparse everything)
   * in a way that will easily allow us to swap out for the more optimized
   * version?
   *
   * DISCUSSION:
   * (1) in analyze, call a function to determine the diffed region - initially it can return everything.
   * (2) then have a function which determines the node of the current AST that this region belongs to -- initially it should be the root node
   * (3) then, have a function that determines the text region which belongs to that node
   * NOTE: this actually boils down to how we design the AST. The AST will basically be a wrapper/container for all the
   *       ast nodes we've defined.
   *      
   * TODO optimizations can include:
   *  (1) determining the diff
   *  (2) determining the minimal AST node containing the diff
   *  (3) parse the text region corresponding to the minimal AST node
   *  (4) replace that AST node
   */
  analyze(newText) {
    // get textual diff
    const textDiff = this.diff(newText, this.text)

    // get affected ast nodes and the corresponding text blocks to reparse
    const astDiff = this.ast.diff(textDiff)

    for (const change of astDiff) {
      // reparse
      const newNode = this.parser.analyze(change.text)

      // replace ast node with new node
      this.ast.replace(change.node, newNode)
    }

    // we done.
  }
  
  parse(blockArray) {
    const blockTokens = map(blockArray, block => this.lexer.tokenize(block.text))
    const ast = this.parser.analyze(blockTokens)
    this.ast = ast
    this.scheduler.setSymbols(this.symbols)
    this.scheduler.setAST(this.ast)
    // console.log(ast)
  }
  
  /**
   * diff determines the diffed regions of text.
   *
   * @description there are multiple types of diffs that are possible which result from 
   *
   * @param {idk} newText the new text state
   * @param {idk} oldText the old text state
   *
   * @return {idk} the regions of text that are different now.
   */
  diff(newText, oldText) {
    // TODO use jsdiff (https://www.npmjs.com/package/diff)
    
    return null
  }
}
