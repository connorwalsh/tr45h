import { v4 as uuid } from 'uuid'
import { reduce } from 'lodash'

import {
  LexicalTokenType,
  SemanticTokenType,
  newSemanticToken,
  newErrorToken,
} from '../types/tokens'



/**
 *
 * Performs a first-pass parse over a stream of lexical tokens.
 *
 * @description
 */
export class FirstPassParser {
  constructor(symbolTable) {
    this.symbolTable = symbolTable

    // initialize internal state
    this.token = { stream: [], index: null }
    this.block = { key: null, index: null }
    this.result = { tokens: [], errors: [] }
  }

  /**
   * resets/hydrates internal state with output from lexical analysis.
   */
  reset({ tokens, errors }, key, index) {
    this.token = { stream: tokens, index: 0}
    this.block = { key, index }
    this.result = { tokens: [], errors }
  }

  peek(skipAhead = 0) {
    const at = this.token.index + skipAhead
    return at <= (this.token.stream.length - 1) && at >= 0
      ? this.token.stream[at]
      : null
  }

  getLastTokenEnd() {
    const last = this.result.tokens[this.result.tokens.length - 1]
    return last.start + last.length
  }

  getInstanceId(token) {
    return `${token.block}-${token.start}`
  }
  
  advance() { return this.token.stream[++this.token.index] }
  consume() { return this.token.stream[this.token.index++] }
  pushToken(token) { this.result.tokens.push(newSemanticToken(token)) }
  pushError(error) { this.result.errors.push(newErrorToken(error)) }

  
  ////////////////////
  //                //
  //  TEST METHODS  //
  //                //
  ////////////////////
  
  // determine the beginnings of expression types
  isAssignment() {
    return this.peek() &&
      this.peek().type === LexicalTokenType.Identifier &&
      this.peek(1) &&
      this.peek(1).type === LexicalTokenType.Operator &&
      this.peek(1).value === '='
  }
  isSequence() {
    return this.peek() &&
      ( this.peek().type === LexicalTokenType.Identifier ||
        /[\(\[]/.test(this.peek().value) )
  }
  isComment() {
    return this.peek() &&
    this.peek().type === LexicalTokenType.Comment
  }
  isNumber() {
    return this.peek() &&
      this.peek().type === LexicalTokenType.Number
  }
  isHz() {
    return this.peek() &&
      this.peek().type === LexicalTokenType.Hz &&
      this.peek(1) &&
      this.peek(1).type === LexicalTokenType.HzUnit
  }
  isChoice() {
    return this.peek() &&
      this.peek().value === '|' &&
      this.peek(-1) &&
      ( this.peek(-1).type === LexicalTokenType.Identifier ||
        /[\)\]]/.test(this.peek(-1))
      ) &&
      this.peek(1) &&
      ( this.peek(1).type === LexicalTokenType.Identifier ||
        /[\(\[]/.test(this.peek(1))
      )
  }
  isChoiceParameter() {
    return this.peek() &&
      this.peek().value === '(' &&
      this.peek(1) &&
      this.peek(1).type === LexicalTokenType.Number &&
      this.peek(2) &&
      this.peek(2).value === ')'
  }
  isChainOperator() {
    console.log("=====")
    console.log("IS CHAING OPERATOR?")
    console.log(this.peek(-1))
    console.log(this.peek())
    console.log(this.peek(1))
    if (this.peek(1)) console.log(this.isFn(this.peek(1).value))
    return this.peek() &&  // if current token is chaining operator
      this.peek().type === LexicalTokenType.Operator &&
      this.peek().value === '.' &&
      this.peek(-1) &&     // and previous token is identifier or ) ]
      ( /[\)\]]/.test(this.peek(-1).value) ||
        this.peek(-1).type === LexicalTokenType.Identifier
      ) &&
      this.peek(1) &&     // and next token is a function name
      this.peek(1).type === LexicalTokenType.Identifier &&
      this.isFn(this.peek(1).value)
  }
  isRepetitionOperator() {
    return this.peek() &&
      // either <IDENTIFIER> ) ] * <NUMBER>
      ( this.peek().type === LexicalTokenType.Operator &&
        this.peek().value === '*' &&
        this.peek(1) &&
        this.peek(1).type === LexicalTokenType.Number &&
        this.peek(-1) &&  // LHS is a sequence or identifier
        ( /[\)\]]/.test(this.peek(-1).value) ||
          this.peek(-1).type === LexicalTokenType.Identifier
        )
      ) ||
      // or <NUMBER> * ( [ <IDENTIFIER>
      ( this.peek().type === LexicalTokenType.Number &&
        this.peek(1) &&
        this.peek(1).type === LexicalTokenType.Operator &&
        this.peek(1).value === '*' &&
        this.peek(2) &&  // RHS is a sequence or identifier
        ( /[\(\[]/.test(this.peek(2).value) ||
          ( this.peek(1).type === LexicalTokenType.Identifier &&
            !this.isFn(this.peek(1).value) )
        )
      )
  }
  isVariable(identifier) {
    // check symbol table to see if this is a valid variable.
    return this.symbolTable.isVariable(identifier)
  }
  isFn(identifier) {
    // check symbol table to see if this is a valid static function.
    return this.symbolTable.isFn(identifier)
  }
  isSoundLiteral(identifier) {
    return !this.isFn(identifier) && !this.isVariable(identifier)
  }
  hasQueryParameters() {
    return this.peek(-1) &&
      this.peek(-1).type === LexicalTokenType.Identifier &&
      this.isSoundLiteral(this.peek(-1).value) &&
      this.hasFnParameters('_soundFn')
  }
  hasFnParameters(fnName) {
    return this.peek() &&
      this.peek().value === '(' &&
      this.peek(1) &&
      this.symbolTable.isFnParameter(fnName, this.peek(1).value)
  }


  /////////////////////
  //                 //
  //  PARSE METHODS  //
  //                 //
  /////////////////////
  
  parseEndOfStatement() {
    if (this.peek() !== null) {
      if (this.peek().type === LexicalTokenType.Comment) {
        this.pushToken(this.consume())
        return
      }
      
      const endToken = this.token.stream[this.token.stream.length - 1]
      const end = endToken.start + endToken.length
      this.pushError({ start: this.peek().start, length: end - this.peek().start, reasons: [], block: this.block.key})
    }
  }

  parseComment() {
    if (this.peek() && this.peek().type === LexicalTokenType.Comment)
      this.pushToken(this.consume())
  }
  
  parseAssignment() {
    const start = this.peek().start
    
    // we know the structure is <VARIABLE_DECL> =
    this.pushToken({ ...this.consume(), type: SemanticTokenType.VariableDecl })
    this.pushToken({...this.consume(), type: SemanticTokenType.AssignmentOp})

    // we can assign sequences or function chains or numbers
    if (this.isNumber()) {
      this.pushToken(this.consume())

      this.parseEndOfStatement()
    } else if (this.isHz()) {
      this.pushToken(this.consume()) // Hz
      this.pushToken(this.consume()) // HzUnit
      
      this.parseEndOfStatement()
      
    } else if(this.peek() && this.isFn(this.peek().value)) {
      this.parseFn()
      this.parseEndOfStatement()
    } else if (this.isSequence()) {
      this.parseSequence()
      this.parseComment()
    } else {
      const end = this.getLastTokenEnd()
      this.pushError({ start, length: end - start, reasons: [], block: this.block.key})
    }
  }

  parseErrorUntilEndOfParamScope() {
    const start = this.peek().start
    while (this.peek() && !/[\),]/.test(this.peek().value)) this.advance()

    if (/[,]/.test(this.peek().value)) this.advance()
    
    const end = this.peek(-1).start + this.peek(-1).length

    this.pushError({ start, length: end - start, reasons: [], block: this.block.key})
  }
  
  parseFnParameters(fnName) {
    // we know the structure so far is
    // ( <FnParam>

    // pop off fn bracket
    this.pushToken({...this.consume(), type: SemanticTokenType.FnBracket})

    let parameters = {}

    while (this.peek() && !/[\)]/.test(this.peek().value)) {
      if (!this.symbolTable.isFnParameter(fnName, this.peek().value)) {
        this.parseErrorUntilEndOfParamScope()
        continue
      }
      
      // is this parameter a flag parameter?
      if (this.symbolTable.isFnFlagParameter(fnName, this.peek().value)) {
        parameters = {...parameters, ...this.symbolTable.translateFnArgs(fnName, this.peek().value, [])}
        this.pushToken({...this.consume(), type: SemanticTokenType.FnParameter})
        
        // is there a comma param delimiter?
        if (/[,]/.test(this.peek().value))
          this.pushToken({...this.consume(), type: SemanticTokenType.FnParamDelimiter}) // pop off the parameter delimiter
        continue
      }

      // okay this must be a key-value parameter

      // make sure that there is a kv delimiter
      if (this.peek(1) && !/[:]/.test(this.peek(1).value)) {
        this.parseErrorUntilEndOfParamScope()
        continue
      }

      // make sure that the value type is correct
      if (this.peek(2) && !this.symbolTable.isValidFnArg(fnName, this.peek().value, this.peek(2))) {
        this.parseErrorUntilEndOfParamScope()
        continue
      }

      const paramName = {...this.consume(), type: SemanticTokenType.FnParameter}           // pop off the parameter name
      const kvDelimiter = {...this.consume(), type: SemanticTokenType.FnParamKvDelimiter}  // pop off the parameter kv delimiter
      let args = []
      while (this.peek() && !/[,\)]/.test(this.peek().value)) args.push(this.consume())    // pop off arg tokens (can be multiple. e.g. HZ & HZ_UNIT)

      // push all tokens
      this.pushToken(paramName)
      this.pushToken(kvDelimiter)
      args.forEach(a => this.pushToken(a))
      
      // we should be good, add to parameter mapping
      parameters = {...parameters, ...this.symbolTable.translateFnArgs(fnName, paramName.value, args)}

      // is there a comma param delimiter?
      if (/[,]/.test(this.peek().value))
        this.pushToken({...this.consume(), type: SemanticTokenType.FnParamDelimiter}) // pop off the parameter delimiter
    }

    // pop off fn bracket
    this.pushToken({...this.consume(), type: SemanticTokenType.FnBracket})
    
    return parameters
  }

  parseFnChain() {
    // we know that the structure so far is . <FN>
    console.log("PARSING FN CHAIN")

    // consume the chaining operator
    this.pushToken({...this.consume(), type: SemanticTokenType.ChainingOp})

    // now lets parse the function
    this.parseFn()
  }
  
  parseFn() {
    // we know the current token is a function name
    
    const fnToken = this.consume()
    
    // parse parameters if necessary
    let parameters = {}
    if (this.hasFnParameters(fnToken.value)) {
      parameters = this.parseFnParameters(fnToken.value)
    }
    
    // push fn token
    this.pushToken({...fnToken, type: SemanticTokenType.Fn, parameters})
    
    // check for chaining
    if (this.isChainOperator())
      this.parseFnChain()
  }
  
  parseIdentifier() {
    // so this could be a
    // * variable
    // * a sound literal
    // * a sound literal with query parameters

    if (this.isVariable(this.peek().value)) {
      // assign instance id to variable
      this.pushToken({
        ...this.consume(),
        type: SemanticTokenType.Variable,
      })
    } else if (this.isSoundLiteral(this.peek().value)) {
      const soundLiteral = this.consume()
      let parameters = {}
      // check for query parameters
      if (this.hasQueryParameters()) {
        parameters = this.parseFnParameters(`_soundFn`)
      }

      const paramStr = reduce(
        parameters,
        (acc, v, k) => `${acc}${acc === '' ? '' : '_'}${k}-${v}`,
        ''
      )
      
      this.pushToken({
        ...soundLiteral,
        type: SemanticTokenType.SoundLiteral,
        id: `${soundLiteral.value.replace(/\s+/g, '_')}__${paramStr}`,  // assign sound literal id (combo of value and query parameters)
        parameters,                                                     // include parameters so we don't have to reparse later
      })

      // TODO merge into symbol table?
      
    } else {
      // error?
    }

  }

  parseChoice() {
    // we know the structure should be
    // | <IDENTIFIER> or | ( or | [

    while (this.peek() && this.isChoice()) {
      // pop off the choice operator
      this.pushToken({...this.consume(), type: SemanticTokenType.ChoiceOp })

      if (this.isChoiceParameter()) {
        // pop off left paren, number, & right paren
        this.pushToken({...this.consume(), type: SemanticTokenType.FnBracket}) // left paren
        this.pushToken(this.consume()) // number
        this.pushToken({...this.consume(), type: SemanticTokenType.FnBracket}) // right paren
      }

      if (this.isSequence()) {
        this.parseSequence()
      } else {
        this.parseEndOfStatement()
        return
      }
    }
  }
  
  parseSequence() {

    // TODO BUG FIX: if a sequence starts with () or [], it will not properly parse remaining steps at the end!
    
    // we know the structure should be either
    // <IDENTIFIER> or ( or [

    // if ( or [, lets pop them off (synce lexical analysis ensures they are balanced properly)
    if (/[\(]/.test(this.peek().value)) {
      this.pushToken({...this.consume(), type: SemanticTokenType.SequenceBracket})
    } else if (/[\[]/.test(this.peek().value)) {
      this.pushToken({...this.consume(), type: SemanticTokenType.BeatDivBracket})
    }

    // iterate over steps
    while(this.peek() && !/[\)\]]/.test(this.peek().value)) {
      if (this.peek().type === LexicalTokenType.Identifier) {
        this.parseIdentifier()
      } else if (this.isSequence()) {
        this.parseSequence()
      } else if (this.isChoice()) {
        this.parseChoice()
      } else if (this.isChainOperator()) {
        this.parseFnChain()
      } else if (this.isRepetitionOperator()) {
        this.parseRepetitionOperator()
      } else {
        this.parseEndOfStatement()
        return
      }
    }

    // pop off right bracket if necessary
    if (this.peek() && /[\)]/.test(this.peek().value)) {
      this.pushToken({...this.consume(), type: SemanticTokenType.SequenceBracket})
    } else if (this.peek() && /[\]]/.test(this.peek().value)) {
      this.pushToken({...this.consume(), type: SemanticTokenType.BeatDivBracket})
    }
  }

  // the point of this isn't to create a parse tree, but rather augment tokens from
  // lexical analysis with more specific types and report semantic/type errors.
  // in other words, this needs to be fast and not concerned with creating a tree.
  analyze(tokens, blockKey, blockIndex) {
    this.reset(tokens, blockKey, blockIndex)

    // there are three kinds of statements: (1) sequence (2) assignment (3) comments
    if (this.isAssignment()) {
      this.parseAssignment()
    } else if (this.isSequence()) {
      this.parseSequence()
    } else {
      this.parseEndOfStatement()
    }
    
    return this.result
  }
}