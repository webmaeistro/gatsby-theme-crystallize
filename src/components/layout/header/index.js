import React, { useState } from "react"
import { Link } from "gatsby"
import { IconLogo } from "ui"

import { Outer, Nav, Logo, NavList, NavListItem, NavAndActions } from "./styles"
import BurgerButton from "./burger-button"
import LocaleSwitcher from "./locale-switcher"
import Search from "./search"

export default function Header({ headerItems }) {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <Outer>
      <Link to="/">
        <Logo>
          <IconLogo alt="Ørn forlag hjem" />
        </Logo>
      </Link>
      <Nav open={navOpen}>
        <NavList>
          {headerItems
            ?.filter((i) => !i.name.startsWith("_"))
            .map((headerItem) => {
              const { name, path } = headerItem

              return (
                <NavListItem key={path}>
                  <Link to={path}>{name}</Link>
                </NavListItem>
              )
            })}
        </NavList>
      </Nav>
      <NavAndActions>
        <LocaleSwitcher />
        <Search />
      </NavAndActions>
      <BurgerButton active={navOpen} onClick={() => setNavOpen(!navOpen)} />
    </Outer>
  )
}
