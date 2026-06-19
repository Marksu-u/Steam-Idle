import React, { Component } from "react";
import { Button } from "reactstrap";

const FALLBACK_IMAGE =
  "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/765/e41b9489145e521153eb6b02774bb7a7f519cee8.jpg";

function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const pad = n => String(n).padStart(2, "0");
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

class IdlingList extends Component {
  constructor(props) {
    super(props);
    this.state = { now: Date.now() };
  }

  componentDidMount() {
    // A single ticker drives every row's timer.
    this.timer = setInterval(() => this.setState({ now: Date.now() }), 1000);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  render() {
    const { idling, onStop } = this.props;
    if (!idling.length) {
      return <small style={{ opacity: 0.6 }}>No games idling.</small>;
    }
    return (
      <div>
        {idling.map(game => {
          const elapsed = (this.state.now - game.startTime) / 1000;
          const timer =
            game.durationMs > 0
              ? `↓ ${formatDuration(game.durationMs / 1000 - elapsed)}`
              : `↑ ${formatDuration(elapsed)}`;
          return (
            <div
              key={game.id}
              style={{ display: "flex", marginBottom: "10px", alignItems: "center" }}
            >
              <img
                alt={game.name}
                src={`http://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/header_292x136.jpg`}
                onError={e => (e.target.src = FALLBACK_IMAGE)}
                style={{ maxWidth: "120px" }}
              />
              <div style={{ paddingLeft: "10px", flex: 1 }}>
                <h6 style={{ marginBottom: "2px" }}>
                  {game.name} <small>ID: {game.appid}</small>
                </h6>
                <span style={{ fontFamily: "monospace" }}>{timer}</span>
              </div>
              <Button color="danger" size="sm" onClick={() => onStop(game.id)}>
                Stop
              </Button>
            </div>
          );
        })}
      </div>
    );
  }
}

export default IdlingList;
