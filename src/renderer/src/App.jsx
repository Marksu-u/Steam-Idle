import React, { Component } from "react";
import { Container } from "reactstrap";

import Footer from "./components/Footer";
import LauncherForm from "./components/LauncherForm";
import WindowControl from "./components/WindowControl";
import UpdateModal from "./components/UpdateModal";

class App extends Component {
  constructor() {
    super();
    this.state = {
      version: "",
      updateAvailable: false,
      downloadingUpdate: false,
      updateProgress: {},
      updateModal: false,
      gamesToLaunch: []
    };
    this.toggleUpdate = this.toggleUpdate.bind(this);
    this.addGameToList = this.addGameToList.bind(this);
    this.removeGame = this.removeGame.bind(this);
    this.clearQueue = this.clearQueue.bind(this);
  }

  componentDidMount() {
    let _self = this;
    window.api.getVersion().then(version => _self.setState({ version }));
    window.api.onUpdateReady(() => {
      _self.setState({
        updateAvailable: true,
        downloadingUpdate: false
      });
    });
    window.api.onDownloadProgress(progress => {
      _self.setState({
        downloadingUpdate: true,
        updateProgress: progress
      });
    });
  }

  downloadUpdate() {
    window.api.downloadUpdate();
  }

  addGameToList(game, time) {
    this.setState(({ gamesToLaunch, appids }) => {
      return {
        gamesToLaunch: [...new Set([...gamesToLaunch, game])]
      };
    });
  }

  removeGame(index) {
    this.setState({
      gamesToLaunch: this.state.gamesToLaunch.filter((_, i) => i !== index)
    });
  }

  clearQueue() {
    this.setState({ gamesToLaunch: [] });
  }

  toggleUpdate() {
    this.setState({
      updateModal: !this.state.updateModal
    });
  }

  render() {
    return (
      <div>
        <WindowControl
          version={this.state.version}
          updateAvailable={this.state.updateAvailable}
          openUpdate={this.toggleUpdate}
          downloadingUpdate={this.state.downloadingUpdate}
          updateProgress={this.state.updateProgress}
        />
        <Container>
          <header>
            <br />
            <h1 style={{ textAlign: "center" }} id="title">
              Steam Idle <small>{this.state.version}</small>
            </h1>
            <br />
          </header>
          <LauncherForm
            removeGame={this.removeGame}
            clearQueue={this.clearQueue}
            addGameToList={this.addGameToList}
            gamesToLaunch={this.state.gamesToLaunch}
          />
          <UpdateModal
            show={this.state.updateModal}
            toggle={this.toggleUpdate}
          />
          <Footer />
        </Container>
      </div>
    );
  }
}

export default App;
