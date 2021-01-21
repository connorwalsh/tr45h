import React from  'react'
import { withTheme, styled } from "@material-ui/core/styles"

import { Logo } from '../logo'
import { Info } from './info'
import { Playback } from './playback'
import { Commands } from './commands'


const MenuBar = withTheme(styled('div')({
  top: 0,
  width: '100%',
  position: 'sticky',
  backgroundColor: '#434343ff',//p => p.theme.palette.background.tertiary, //'#23272e',
  color: p => p.hasError ? 'red': p.theme.palette.text.tertiary,
  // padding: '0.2% 0% 0.2% 0%',
  zIndex: 999999,
  display: 'flex',
}))

const Half = withTheme(styled('div')({
  width: '50%',
  display: 'flex',
  justifyContent: p => p.justifyContent || 'flex-start',
}))

export const Menu = props => {

  return (
    <MenuBar>
      <Half>
        <Logo/>
        <Info/>
      </Half>
      <Half justifyContent="space-between">
        <Commands/>
        <Playback/>
      </Half>
    </MenuBar>
  )
}