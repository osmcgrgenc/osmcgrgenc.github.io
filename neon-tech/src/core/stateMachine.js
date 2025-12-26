export class StateMachine {
  constructor(initialState) {
    this.state = initialState;
    this.states = new Map();
  }

  register(name, state) {
    this.states.set(name, state);
  }

  change(name, payload) {
    if (this.state && this.state.exit) this.state.exit();
    this.state = this.states.get(name);
    if (this.state && this.state.enter) this.state.enter(payload);
  }

  update(dt) {
    if (this.state && this.state.update) this.state.update(dt);
  }

  render(alpha) {
    if (this.state && this.state.render) this.state.render(alpha);
  }
}
