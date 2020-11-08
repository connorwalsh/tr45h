import { NotImplementedError } from './error'

/**
 * Step is a data-type which represents a fully-resolved step in a sequence.
 *
 * @description it contains information about:
 *  * ppqn
 *  * applied fx
 */
// {type: 'sound', value: "maybe its a multiword string", fx: [], ppqn: 32}

/**
 * ASTNode is an abstract class representation for a node in the AST.
 *
 * @description this abstract class is extended by more specific node types
 * in the AST and defines the interface in which all nodes in the AST interact
 * with one another. The interface is defines is:
 *  current() - a method which returns the current fully resolved step
 *  next()    - a method which returns the next fully resolved step
 *  advance() - a method which advances the current unresolved step and 
 *              current/next fully resolved steps.
 */
export class ASTNode {
  /**
   * initializes the current/next fully resolved steps.
   *
   * @description on initialization, the current and next steps are equal.
   *
   * @param {Step} initialStep the initial fully resolved step.
   */
  constructor(initialStep) {
    // _current and _next are the fully resolved current and next steps
    this._current = initialStep
    this._next = initialStep
  }

  /**
   * current is a getter method for getting the fully resolved current step.
   *
   * @returns {Step} the current fully resolved step
   */
  current() { return this._current }

  /**
   * next is a getter method for getting the fully resolved next step.
   *
   * @returns {Step} the next fully resolved step
   */
  next() { return this._next }

  /**
   * advance is an unimplemented method for advancing the current and next fully resolved steps.
   *
   * @returns {bool} true if advancing has 'cycled' its step stream, false otherwise.
   */
  advance() { throw new NotImplementedError('advance()') }
}


/**
 * Terminal represents a leaf node in the AST.
 */
export class Terminal extends ASTNode {
  /**
   * sets the current and next steps to one step.
   */
  constructor(step) { super(step) }

  /**
   * 'advances' the terminal to the next step in the step stream.
   *
   * @description since a terminal consists of only one step, no actual advancing is done.
   * i.e. the current and next values remain the same (and are equal to eachother). This
   * implementation always returns true because advancing a terminal step always cycles.
   *
   * @returns {true} a terminal step always 'cycles' when advanced.
   */
  advance() { return true }
}


/**
 * NonTerminal represents an intermediary node within the AST.
 *
 * @description since a nonterminal AST node can be a sequence or choice of some
 * child AST nodes, advancing an intermediary node is more complex than advancing
 * a terminal AST node. This is because an NonTerminal AST node can be composed of
 * a stream of AST Nodes (not simply Terminal AST nodes). For this reason, a NonTerminal
 * must keep track of the current AST Node (either Terminal or NonTerminal).
 */
export class NonTerminal extends ASTNode {
  /**
   * constructs a NonTerminal.
   *
   * @param {ASTNode} currentNode the current AST Node of this NonTerminal.
   */
  constructor(currentNode) {
    // initialize the current step to be the current step of the current AST Node.
    super(currentNode.current())

    // set the current node
    this._currentNode = currentNode
  }

  /**
   * advances the current an next steps forward and potentially sets the currentNode to a new value.
   *
   * @description since a NonTerminal can be composed of a stream of ASTNodes (Terminal or NonTerminal),
   * when advancing, we need to determine whether the currentNode has cycled. If it has, we need to
   * update the currentNode (by calling advanceCurrentNode). But, if in advancing the currentNode
   * this NonTerminal itself cycles, we need bubble that up to the parent of this NonTerminal. Note that
   * a precondition for this NonTerminal cycling, is that its currentNode has to have cycled also.
   *
   * @returns {bool} true if this Nonterminal, itself, has cycled, false otherwise.
   */
  advance() {
    let thisHasCycled = false

    // if the current AST node has cycled, we must advance the currentNode
    if ( this._currentNode.advance() )
      thisHasCycled = this.advanceCurrentNode()

    this._current = this._next
    this._next = this._currentNode.next()
    return thisHasCycled
  }

  /**
   * an abstract method which advances the current ASTNode (currentNode) and reports cycling information.
   *
   * @returns {bool} if this NonTerminal, itself, has cycled while advancing its currentNode.
   */
  advanceCurrentNode() { throw new NotImplementedError('advanceCurrentNode()') }
}


export class Sequence extends NonTerminal {
  constructor(seq) {
    super(seq[0])
    
    this._currentNodeIndex = 0
    this._seq = seq
  }

  advanceCurrentNode() {
    let hasCycled = false
    if ( this._currentNodeIndex === this._seq.length - 1 ) {
      this._currentNodeIndex = 0
      hasCycled = true
    } else {
      this._currentNodeIndex += 1
    }

    this._currentNode = this._seq[this._currentNodeIndex]

    return hasCycled
  }
}

const choose = (choices, cdf) =>
  choices[cdf.filter(c => c <= Math.random() * cdf[cdf.length - 1]).length]

export class Choice extends NonTerminal {
  constructor(choices, pdf, choiceFn = choose) {
    // derive the cumulative distribution function
    let acc = 0
    const cdf = pdf.map(p => (acc = p + acc))

    super(choiceFn(choices, cdf))
    
    this._choices = choices
    this._pdf = pdf
    this._cdf = cdf
    this._choose = choiceFn
  }
  
  advanceCurrentNode() {
    // probabilistically choose a new choice for _currentUnresolved
    this._currentNode = this._choose(this._choices, this._cdf)

    return true
  }
}
