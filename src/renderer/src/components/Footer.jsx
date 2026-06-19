import React, { Component } from "react";
import styled from "styled-components";
import { Modal, ModalHeader, ModalBody } from "reactstrap";

import patchNotes from "../patchNotes";

const Heart = styled.i`
  color: #ff5357;
  font-size: 16px;
  vertical-align: middle;
`;

const Link = styled.a`
  text-decoration: none;
  transition: ease all 0.2s;
  cursor: pointer;
  &:hover {
    text-decoration: none;
    opacity: 0.8;
  }
`;

const Line = styled.div`
  margin-bottom: 6px;
`;

const Muted = styled.small`
  opacity: 0.7;
`;

const ext = url => () => window.api.openExternal(url);

class Footer extends Component {
  constructor() {
    super();
    this.state = { notesOpen: false };
    this.toggleNotes = this.toggleNotes.bind(this);
  }

  toggleNotes() {
    this.setState({ notesOpen: !this.state.notesOpen });
  }

  render() {
    return (
      <footer style={{ paddingTop: "24px", paddingBottom: "16px", lineHeight: 1.7 }}>
        <Line>
          Created with <Heart className="material-icons">favorite</Heart> by
          {" "}
          <Link onClick={ext("https://github.com/DevNvll")}>DevNvll</Link>
        </Line>
        <Line>
          v3 fork maintained by
          {" "}
          <Link onClick={ext("https://github.com/Marksu-u")}>mKzz</Link>
        </Line>
        <Line style={{ marginTop: "14px" }}>
          <Link onClick={ext("https://github.com/DevNvll/Steam-Idle")}>
            GitHub
          </Link>
          {"  ·  "}
          <Link onClick={ext("https://github.com/Marksu-u/Steam-Idle")}>
            Fork
          </Link>
        </Line>
        <Line style={{ marginTop: "14px" }}>
          <Muted>
            Powered by
            {" "}
            <Link onClick={ext("https://steamworks.github.io/")}>
              Steamworks.NET
            </Link>
            {"  ·  "}
            <Link onClick={ext("https://react.dev/")}>React</Link>
            {"  ·  "}
            <Link onClick={ext("https://www.electronjs.org/")}>Electron</Link>
          </Muted>
        </Line>
        <Muted>
          <Link onClick={this.toggleNotes}>Version {this.props.version}</Link>
        </Muted>

        <Modal
          isOpen={this.state.notesOpen}
          toggle={this.toggleNotes}
          style={{ color: "#222" }}
        >
          <ModalHeader toggle={this.toggleNotes}>
            What's new in {this.props.version}
          </ModalHeader>
          <ModalBody>
            <ul style={{ marginBottom: 0, paddingLeft: "20px" }}>
              {patchNotes.map((note, i) => (
                <li key={i} style={{ marginBottom: "6px" }}>{note}</li>
              ))}
            </ul>
          </ModalBody>
        </Modal>
      </footer>
    );
  }
}

export default Footer;
