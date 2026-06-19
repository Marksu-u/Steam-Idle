import React, { Component } from "react";
import { Container, Button } from "reactstrap";

import Footer from "./components/Footer";
import LauncherForm from "./components/LauncherForm";
import WindowControl from "./components/WindowControl";
import UpdateModal from "./components/UpdateModal";
import CollapsibleSection from "./components/CollapsibleSection";
import IdlingList from "./components/IdlingList";

class App extends Component {
  constructor() {
    super();
    this.state = {
      version: "",
      updateAvailable: false,
      downloadingUpdate: false,
      updateProgress: {},
      updateModal: false,
      gamesToLaunch: [],
      idling: []
    };
    this.toggleUpdate = this.toggleUpdate.bind(this);
    this.addGameToList = this.addGameToList.bind(this);
    this.removeGame = this.removeGame.bind(this);
    this.clearQueue = this.clearQueue.bind(this);
    this.handleStop = this.handleStop.bind(this);
    this.handleStopAll = this.handleStopAll.bind(this);
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

    // Mirror the main-process idler registry.
    window.api.listIdlers().then(list => _self.setState({ idling: list }));
    window.api.onIdlerStarted(entry => {
      _self.setState(s =>
        s.idling.some(g => g.id === entry.id)
          ? null
          : { idling: [...s.idling, entry] }
      );
    });
    window.api.onIdlerStopped(({ id }) => {
      _self.setState(s => ({ idling: s.idling.filter(g => g.id !== id) }));
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

  handleStop(id) {
    window.api.stopIdler(id);
  }

  handleStopAll() {
    window.api.stopAllIdlers();
  }

  toggleUpdate() {
    this.setState({
      updateModal: !this.state.updateModal
    });
  }

  render() {
    const selectedPanel = (
      <CollapsibleSection
        key="selected"
        title="Selected games"
        count={this.state.gamesToLaunch.length}
      >
        <LauncherForm
          removeGame={this.removeGame}
          clearQueue={this.clearQueue}
          addGameToList={this.addGameToList}
          gamesToLaunch={this.state.gamesToLaunch}
        />
      </CollapsibleSection>
    );

    const idlingPanel = (
      <CollapsibleSection
        key="idling"
        title="Currently idling"
        count={this.state.idling.length}
        action={
          this.state.idling.length > 0
            ? <Button color="danger" size="sm" onClick={this.handleStopAll}>
                Stop all
              </Button>
            : null
        }
      >
        <IdlingList idling={this.state.idling} onStop={this.handleStop} />
      </CollapsibleSection>
    );

    // Priority: staging on top while adding games, otherwise running idlers.
    const panels =
      this.state.gamesToLaunch.length > 0
        ? [selectedPanel, idlingPanel]
        : [idlingPanel, selectedPanel];

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
          {panels}
          <UpdateModal
            show={this.state.updateModal}
            toggle={this.toggleUpdate}
          />
          <Footer version={this.state.version} />
        </Container>
      </div>
    );
  }
}

export default App;
