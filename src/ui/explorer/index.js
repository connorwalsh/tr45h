import React from  'react'
import { withTheme, styled } from "@material-ui/core/styles"


const Container = withTheme(styled('div')({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  width: '100%',
  backgroundColor: '#e3e3e3',
}))

const Header = withTheme(styled('div')({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  width: '100%',
  padding: '1% 1% 1% 1%',
  borderBottom: '1px black solid',
  
}))

const Title = withTheme(styled('div')({
  textAlign: 'center',
  color: 'cornflowerblue',
  fontSize: 'calc(10px + 2vmin)'
}))

const CloseButton = withTheme(styled('div')({
  border: '1px solid black',
}))

const Body = withTheme(styled('div')({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  width: '100%',
  padding: '1% 1% 1% 1%',
}))

export const Explorer = props => {

  const title = 'collections'
  
  return (
    <Container>
      <Header>
        <Title>{title}</Title>
        <CloseButton>x</CloseButton>
      </Header>
      <Body>
        kool
      </Body>
    </Container>
  )
}
