export class Menus {
  constructor(root) {
    this.root = root;
    this.menu = root.querySelector('#menu');
    this.loadout = root.querySelector('#loadout');
    this.hideout = root.querySelector('#hideout');
    this.settings = root.querySelector('#settings');
    this.results = root.querySelector('#results');

    this.actionHandlers = new Map();
    this.roleHandlers = new Map();
    this.upgradeHandlers = new Map();

    this.bind();
  }

  bind() {
    this.root.querySelectorAll('[data-action]').forEach((button) => {
      button.addEventListener('click', () => {
        const action = button.dataset.action;
        const handler = this.actionHandlers.get(action);
        if (handler) handler();
      });
    });

    this.root.querySelectorAll('[data-role]').forEach((button) => {
      button.addEventListener('click', () => {
        const role = button.dataset.role;
        const handler = this.roleHandlers.get(role);
        if (handler) handler(role);
      });
    });

    this.root.querySelectorAll('.upgrade button').forEach((button) => {
      const upgrade = button.closest('.upgrade');
      button.addEventListener('click', () => {
        const type = upgrade.dataset.upgrade;
        const handler = this.upgradeHandlers.get(type);
        if (handler) handler(type);
      });
    });
  }

  onAction(action, handler) {
    this.actionHandlers.set(action, handler);
  }

  onRole(role, handler) {
    this.roleHandlers.set(role, handler);
  }

  onUpgrade(type, handler) {
    this.upgradeHandlers.set(type, handler);
  }

  show(screen) {
    [this.menu, this.loadout, this.hideout, this.settings, this.results].forEach((el) => {
      el.classList.add('hidden');
    });
    if (screen) screen.classList.remove('hidden');
  }

  updateUpgradeLevels(upgrades) {
    this.hideout.querySelectorAll('.upgrade').forEach((card) => {
      const level = upgrades[card.dataset.upgrade];
      const label = card.querySelector('.level');
      label.textContent = `Lv ${level}`;
    });
  }

  showResults({ title, summary }) {
    this.results.querySelector('#results-title').textContent = title;
    this.results.querySelector('#results-summary').textContent = summary;
    this.show(this.results);
  }
}
