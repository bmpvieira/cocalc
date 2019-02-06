// 3rd Party Libraries
import * as markdown from "../markdown";
import { Button, ButtonToolbar, FormControl, FormGroup } from "react-bootstrap";

// Internal Libraries
import {
  Component,
  React,
  ReactDOM,
  Rendered,
  rclass,
  redux,
  rtypes
} from "../app-framework";

// Sibling Libraries
import * as info from "./info";
import { MarkdownWidgetActions } from "./actions";
import { MarkdownWidgetStore, MarkdownWidgetStoreState } from "./store";

export function init(): void {
  if (redux.hasActions(info.name)) {
    return;
  }
  redux.createStore(info.name, MarkdownWidgetStore);
  redux.createActions(info.name, MarkdownWidgetActions);
}

interface ReactProps {
  autoFocus: boolean;
  persist_id: string; // A unique id to identify the input. Required if you want automatic persistence
  attach_to: string; // Removes record when given store name is destroyed. Only use with persist_id
  default_value: string;
  editing: boolean; // Used to control the edit/display state. CANNOT be used with persist_id
  save_disabled: boolean; // Used to control the save button
  on_change: (value: string) => any; // called with the new value when the value while editing changes
  on_save: (value: string) => any; // called when saving from editing and switching back
  on_edit: (value: string) => any; // called when editing starts
  on_cancel: (value: string) => any; // called when cancel button clicked
  rows: number;
  placeholder: string;
  rendered_style: object;
  hide_edit_button: boolean;
  edit_button_text: string;
  edit_button_bsSize: string;
}

interface ReduxProps {
  open_inputs: Map<any, any>;
}

interface MarkdownInputState {
  editing: boolean;
  value: string;
}

class MarkdownInput0 extends Component<
  ReactProps & ReduxProps,
  MarkdownInputState
> {
  displayName: "WidgetMarkdownInput";

  constructor(props) {
    super(props);
    this.state = this.getInitialState();
  }

  static reduxProps() {
    return {
      markdown_inputs: {
        open_inputs: rtypes.immutable.Map.isRequired
      }
    };
  }

  getInitialState = () => {
    let value = this.props.default_value || "";
    let editing = false;
    if (
      this.props.persist_id &&
      this.props.open_inputs.has(this.props.persist_id)
    ) {
      value = this.props.open_inputs.get(this.props.persist_id);
      editing = true;
    }

    return {
      editing,
      value
    };
  };

  static defaultProps = {
    edit_button_text: "Edit",
    hide_edit_button: false
  };

  getActions() {
    return redux.getActions<MarkdownWidgetStoreState, MarkdownWidgetActions>(
      info.name
    );
  }

  componentDidMount() {
    if (
      this.props.attach_to &&
      !this.props.open_inputs.has(this.props.persist_id)
    ) {
      (redux as any)
        .getStore(this.props.attach_to)
        .on("destroy", this.clear_persist);
    }
  }

  componentWillUnmount() {
    if (
      this.props.persist_id != null &&
      !(this.state.editing || this.props.editing)
    ) {
      this.clear_persist();
    }
  }

  persist_value = value => {
    if (this.props.persist_id != null) {
      this.getActions().set_value(
        this.props.persist_id,
        value != null ? value : this.state.value
      );
    }
  };

  clear_persist = () => {
    if (this.props.persist_id != null) {
      this.getActions().clear(this.props.persist_id);
    }
  };

  set_value = value => {
    if (typeof this.props.on_change === "function") {
      this.props.on_change(value);
    }
    this.persist_value(value);
    this.setState({ value });
  };

  edit = () => {
    if (typeof this.props.on_edit === "function") {
      this.props.on_edit(this.state.value);
    }
    if (this.props.editing == null) {
      this.setState({ editing: true });
    }
    this.setState({ value: this.props.default_value });
  };

  cancel = () => {
    if (typeof this.props.on_cancel === "function") {
      this.props.on_cancel(this.state.value);
    }
    this.clear_persist();
    if (this.props.editing == null) {
      this.setState({ editing: false });
    }
  };

  save = () => {
    if (typeof this.props.on_save === "function") {
      this.props.on_save(this.state.value);
    }
    this.clear_persist();
    if (this.props.editing == null) {
      this.setState({ editing: false });
    }
  };

  keydown = e => {
    if (e.keyCode === 27) {
      this.cancel();
    } else if (e.keyCode === 13 && e.shiftKey) {
      this.save();
    }
  };

  to_html = () => {
    if (this.props.default_value) {
      const html = markdown.markdown_to_html(this.props.default_value);
      return { __html: html };
    } else {
      return { __html: "" };
    }
  };

  render() {
    // Maybe there's a better way to fix this.
    // Required here because of circular requiring otherwise.
    const { Tip, Icon } = require("../r_misc");
    if (this.state.editing || this.props.editing) {
      const tip = (
        <span>
          You may enter (Github flavored) markdown here. In particular, use #
          for headings, > for block quotes, *'s for italic text, **'s for bold
          text, - at the beginning of a line for lists, back ticks ` for code,
          and URL's will automatically become links.
        </span>
      );
      return (
        <div>
          <form onSubmit={this.save} style={{ marginBottom: "-20px" }}>
            <FormGroup>
              <FormControl
                autoFocus={
                  this.props.autoFocus != null ? this.props.autoFocus : true
                }
                ref="input"
                componentClass="textarea"
                rows={this.props.rows != null ? this.props.rows : 4}
                placeholder={this.props.placeholder}
                value={this.state.value}
                onChange={() =>
                  this.set_value(ReactDOM.findDOMNode(this.refs.input).value)
                }
                onKeyDown={this.keydown}
              />
            </FormGroup>
          </form>
          <div style={{ paddingTop: "8px", color: "#666" }}>
            <Tip title="Use Markdown" tip={tip}>
              Format using{" "}
              <a href={info.guide_link} target="_blank">
                Markdown
              </a>
            </Tip>
          </div>
          <ButtonToolbar style={{ paddingBottom: "5px" }}>
            <Button
              key="save"
              bsStyle="success"
              onClick={this.save}
              disabled={
                this.props.save_disabled != null
                  ? this.props.save_disabled
                  : this.state.value === this.props.default_value
              }
            >
              <Icon name="edit" /> Save
            </Button>
            <Button key="cancel" onClick={this.cancel}>
              Cancel
            </Button>
          </ButtonToolbar>
        </div>
      );
    } else {
      const html = this.to_html();
      const style = (html != null
      ? html.__html
      : undefined)
        ? this.props.rendered_style
        : undefined;

      let rendered_button: Rendered = undefined;
      const rendered_text_props: {
        dangerouslySetInnerHTML;
        style;
        onClick?;
      } = (() => {
        if (!this.props.hide_edit_button) {
          const props: { onClick; bsSize? } = { onClick: this.edit };
          if (this.props.edit_button_bsSize) {
            props.bsSize = this.props.edit_button_bsSize;
          }
          rendered_button = (
            <Button {...props}>{this.props.edit_button_text}</Button>
          );
          return {
            dangerouslySetInnerHTML: html,
            style: style
          };
        } else {
          return {
            dangerouslySetInnerHTML: html,
            style: style,
            onClick: this.edit
          };
        }
      })();

      return (
        <div>
          <div {...rendered_text_props} />
          {rendered_button}
        </div>
      );
    }
  }
}

const MarkdownInput = rclass<ReactProps>(MarkdownInput0);
export { MarkdownInput };
