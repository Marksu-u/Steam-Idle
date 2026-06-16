import React, { Component } from "react";
import styled from "styled-components";
import { Dropdown, DropdownMenu, DropdownItem } from "reactstrap";

const MenuIcon = styled.div`
  font-size: 28px;
  color: #fff;
  opacity: 0.5;
  padding: 10px;
  cursor: default;
  -webkit-app-region: no-drag;
  &:hover {
   opacity: 1;
  }
`;

class Menu extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dropdownOpen: false
    };
    this.toggle = this.toggle.bind(this);
    this.openGithub = this.openGithub.bind(this);
    this.openAbout = this.openAbout.bind(this);
  }

  toggle() {
    this.setState({
      dropdownOpen: !this.state.dropdownOpen
    });
  }

  openGithub() {
    window.api.openExternal("https://github.com/DevNvll/Steam-Idle");
  }

  openAbout() {
    window.api.openAbout();
  }

  render() {
    return (
      <Dropdown isOpen={this.state.dropdownOpen} right toggle={this.toggle}>
        <span
          onClick={this.toggle}
          data-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded={this.state.dropdownOpen}
        >
          <MenuIcon className="material-icons">menu</MenuIcon>
        </span>
        <DropdownMenu>
          <DropdownItem header>
            Steam Idle <small>{this.props.version}</small>
          </DropdownItem>
          <DropdownItem divider />
          <DropdownItem onClick={this.openGithub}>GitHub</DropdownItem>
          <DropdownItem onClick={this.openAbout}>About</DropdownItem>
        </DropdownMenu>
      </Dropdown>
    );
  }
}

export default Menu;
