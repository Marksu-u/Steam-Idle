import React, { Component } from "react";
import { createRoot } from "react-dom/client";
import { Container } from "reactstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/index.css";

class About extends Component {
  constructor() {
    super();
    this.state = { version: "" };
  }

  componentDidMount() {
    window.api.getVersion().then(version => this.setState({ version }));
  }

  render() {
    return (
      <Container>
        <center><h1>Steam Idle</h1></center>
        Created by <a
          href="#"
          onClick={() => {
            window.api.openExternal("https://github.com/DevNvll");
          }}
        >
          DevNvll
        </a>.<br />
        Powered by <a
          href="#"
          onClick={() => {
            window.api.openExternal("https://steamworks.github.io/");
          }}
        >
          Steamworks.NET
        </a>, <a
          href="#"
          onClick={() => {
            window.api.openExternal("https://facebook.github.io/react/");
          }}
        >
          React
        </a> and <a
          href="#"
          onClick={() => {
            window.api.openExternal("https://electron.atom.io");
          }}
        >
          Electron
        </a>.<br /><center>Version {this.state.version}</center>
      </Container>
    );
  }
}

createRoot(document.getElementById("root")).render(<About />);
