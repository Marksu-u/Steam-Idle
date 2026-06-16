import React, { Component } from "react";
import { Button } from "reactstrap";

const FALLBACK_IMAGE =
  "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/765/e41b9489145e521153eb6b02774bb7a7f519cee8.jpg";

let RenderGames = ({ games, removeGame }) => (
  <div>
    {games.map((game, i) => (
      <div key={i} style={{ display: "flex", marginBottom: "10px" }}>
        <img
          alt={game.name}
          src={`http://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/header_292x136.jpg`}
          onError={e => (e.target.src = FALLBACK_IMAGE)}
          style={{ maxWidth: "200px", alignSelf: "flex-start" }}
        />
        <div style={{ paddingLeft: "10px" }}>
          <h6>
            {game.name}
            {" "}
            <small>ID: {game.appid}</small>
            {" "}
            <Button color="danger" size="sm" onClick={() => removeGame(i)}>
              X
            </Button>
          </h6>
          <small>
            {(game.time > 0 && "Time: " + game.time + " Hours") ||
              "Unlimited time"}
          </small>
        </div>
      </div>
    ))}
  </div>
);

class GameQueue extends Component {
  render() {
    return (
      <div
        style={{
          width: "100%",
          height: "250px",
          overflow: "auto"
        }}
      >
        <RenderGames
          games={this.props.games}
          removeGame={this.props.removeGame}
        />
      </div>
    );
  }
}

export default GameQueue;
