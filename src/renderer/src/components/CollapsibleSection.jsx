import React, { Component } from "react";
import { Collapse } from "reactstrap";

class CollapsibleSection extends Component {
  constructor(props) {
    super(props);
    this.state = { open: props.defaultOpen !== false };
    this.toggle = this.toggle.bind(this);
  }

  toggle() {
    this.setState({ open: !this.state.open });
  }

  render() {
    const { title, count, action } = this.props;
    return (
      <div style={{ marginBottom: "12px" }}>
        <div
          onClick={this.toggle}
          style={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            userSelect: "none",
            padding: "6px 0",
            borderBottom: "1px solid #333"
          }}
        >
          <i className="material-icons" style={{ fontSize: "20px" }}>
            {this.state.open ? "expand_more" : "chevron_right"}
          </i>
          <span style={{ fontWeight: 600, marginLeft: "4px" }}>{title}</span>
          {typeof count === "number" &&
            <small style={{ marginLeft: "6px", opacity: 0.7 }}>({count})</small>}
          {action &&
            <span
              style={{ marginLeft: "auto" }}
              onClick={e => e.stopPropagation()}
            >
              {action}
            </span>}
        </div>
        <Collapse isOpen={this.state.open}>
          <div style={{ paddingTop: "10px" }}>{this.props.children}</div>
        </Collapse>
      </div>
    );
  }
}

export default CollapsibleSection;
