/**
 * Sistema de hooks async evitando el patron de actions/filters de PHP.
 * Los hooks son middleware explicito con registro y desregistro controlado.
 */

class HookSystem {
  constructor() {
    this._registry = new Map(); // event -> array of {id, fn, priority}
  }

  on(event, fn, priority = 10) {
    if (!this._registry.has(event)) this._registry.set(event, []);
    const handlers = this._registry.get(event);
    const id = `${event}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    handlers.push({ id, fn, priority });
    handlers.sort((a, b) => a.priority - b.priority);
    return id;
  }

  off(event, id) {
    if (!this._registry.has(event)) return false;
    const handlers = this._registry.get(event);
    const idx = handlers.findIndex(h => h.id === id);
    if (idx >= 0) { handlers.splice(idx, 1); return true; }
    return false;
  }

  async run(event, context) {
    if (!this._registry.has(event)) return context;
    let result = context;
    for (const handler of this._registry.get(event)) {
      try {
        result = await handler.fn(result);
        if (result === undefined) result = context;
      } catch (err) {
        err.hookEvent = event;
        err.hookId = handler.id;
        throw err;
      }
    }
    return result;
  }
}

const globalHooks = new HookSystem();

module.exports = { HookSystem, globalHooks };
