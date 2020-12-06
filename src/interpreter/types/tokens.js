

//////////////////////
//                  //
//  LEXICAL TOKENS  //
//                  //
//////////////////////

export const newLexicalToken = fields => ({
  type:   null,
  value:  null,
  start:  null,
  length: null,
  block:  null,
  ...fields,
})

export const LexicalTokenType = {
  Bracket:    'BRACKET',
  Delimiter:  'DELIMITER',
  Quote:      'QUOTE',
  Rest:       'REST',
  Operator:   'OPERATOR',
  Comment:    'COMMENT',
  Number:     'NUMBER',
  Hz:         'HZ',
  HzUnit:     'HZ_UNIT',
  Identifier: 'IDENTIFIER',
  Error:      'ERROR',
}


///////////////////////
//                   //
//  SEMANTIC TOKENS  //
//                   //
///////////////////////

export const SemanticTokenType = {
  Variable:           'VARIABLE',
  VariableDecl:       'VARIABLE_DECL',
  AssignmentOp:       'ASSIGNEMENT_OP',
  Fn:                 'FN',
  FnBracket:          'FN_BRACKET',
  FnParameter:        'FN_PARAMETER',
  FnParamKvDelimiter: 'FN_PARAM_KV_DELIMITER',
  FnParamDelimiter:   'FN_PARAM_DELIMITER',
  SoundLiteral:       'SOUND_LITERAL',
  BeatDivBracket:     'BEAT_DIV_BRACKET',
  SequenceBracket:    'SEQUENCE_BRACKET',
  ChoiceOp:           'CHOICE_OP',
  RepetitionOp:       'REPETITION_OP',
  ChainingOp:         'CHAINING_OP',
}

export const newSemanticToken = fields => ({
  id:       null,  // for identifier uniqueness (keys for identifiers in symbol table)
  instance: null,  // for token uniquenes (`<block>-<startIdx>`)
  type:     null,
  value:    null,
  start:    null,
  length:   null,
  block:    null,
  ...fields,
  instance: `${fields.block}-${fields.start}`
})
