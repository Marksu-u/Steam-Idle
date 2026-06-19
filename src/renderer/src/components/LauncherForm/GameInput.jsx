import React, { Component } from "react";
import Autosuggest from "react-autosuggest";

function getSuggestionValue(suggestion) {
  return suggestion.name;
}

function renderSuggestion(suggestion) {
  return (
    <span>
      {suggestion.icon &&
        <img
          src={suggestion.icon}
          alt=""
          style={{ width: "16px", height: "16px", marginRight: "8px", verticalAlign: "middle" }}
        />}
      {suggestion.name} <small>{suggestion.appid}</small>
    </span>
  );
}

class GameInput extends Component {
  constructor() {
    super();
    this.state = {
      value: "",
      suggestions: []
    };
    this.debounceTimer = null;
    this.latestQuery = "";

    this.onSuggestionsFetchRequested = this.onSuggestionsFetchRequested.bind(
      this
    );
    this.handleSuggestionClick = this.handleSuggestionClick.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onSuggestionsClearRequested = this.onSuggestionsClearRequested.bind(
      this
    );
  }

  componentWillUnmount() {
    clearTimeout(this.debounceTimer);
  }

  onChange(event, { newValue, method }) {
    this.setState({
      value: newValue
    });
  }

  onSuggestionsFetchRequested({ value }) {
    clearTimeout(this.debounceTimer);
    const query = value.trim();
    this.latestQuery = query;
    if (!query) {
      this.setState({ suggestions: [] });
      return;
    }
    this.debounceTimer = setTimeout(() => {
      window.api
        .searchApps(query)
        .then(results => {
          // Ignore stale responses from earlier keystrokes.
          if (query !== this.latestQuery) return;
          this.setState({ suggestions: results.slice(0, 10) });
        })
        .catch(() => {
          if (query !== this.latestQuery) return;
          this.setState({ suggestions: [] });
        });
    }, 250);
  }

  onSuggestionsClearRequested() {
    this.setState({
      suggestions: []
    });
  }

  handleSuggestionClick(e, { suggestion }) {
    this.setState({ value: "" });
    this.props.handleClickGame(suggestion);
  }

  render() {
    const { value, suggestions } = this.state;
    const inputProps = {
      placeholder: "Type a game name or appid.",
      className: "form-control",
      value,
      onChange: this.onChange
    };

    return (
      <div>
        <Autosuggest
          suggestions={suggestions}
          onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
          onSuggestionsClearRequested={this.onSuggestionsClearRequested}
          getSuggestionValue={getSuggestionValue}
          renderSuggestion={renderSuggestion}
          onSuggestionSelected={this.handleSuggestionClick}
          inputProps={inputProps}
        />
      </div>
    );
  }
}

export default GameInput;
