/**
 * V-Framework: A lightweight, React-inspired Vanilla JS Framework
 * Features: Virtual DOM, Component-based architecture, Reactive State, Hook-like effects
 */

const V = (() => {
  // --- Internal State ---
  let currentInstance = null;
  let hookIndex = 0;

  // --- Virtual DOM Engine ---
  function createElement(type, props, ...children) {
    return {
      type,
      props: {
        ...props,
        children: children
          .flat()
          .map((child) =>
            typeof child === "object" ? child : createTextElement(child),
          ),
      },
    };
  }

  function createTextElement(text) {
    return {
      type: "TEXT_ELEMENT",
      props: {
        nodeValue: text,
        children: [],
      },
    };
  }

  // --- Diffing & Rendering Logic ---
  function createDom(fiber) {
    const dom =
      fiber.type === "TEXT_ELEMENT"
        ? document.createTextNode("")
        : document.createElement(fiber.type);

    updateDom(dom, {}, fiber.props);
    return dom;
  }

  function updateDom(dom, prevProps, nextProps) {
    // Remove old listeners
    Object.keys(prevProps)
      .filter((name) => name.startsWith("on"))
      .forEach((name) => {
        const eventType = name.toLowerCase().substring(2);
        dom.removeEventListener(eventType, prevProps[name]);
      });

    // Remove old properties
    Object.keys(prevProps)
      .filter((name) => name !== "children" && !name.startsWith("on"))
      .forEach((name) => (dom[name] = ""));

    // Set new properties
    Object.keys(nextProps)
      .filter((name) => name !== "children" && !name.startsWith("on"))
      .forEach((name) => (dom[name] = nextProps[name]));

    // Add new listeners
    Object.keys(nextProps)
      .filter((name) => name.startsWith("on"))
      .forEach((name) => {
        const eventType = name.toLowerCase().substring(2);
        dom.addEventListener(eventType, nextProps[name]);
      });
  }

  // --- Component Root & Reconciliation ---
  class Component {
    constructor(props) {
      this.props = props || {};
      this.state = {};
      this.hooks = [];
      this._vNode = null;
      this._dom = null;
    }

    setState(newState) {
      this.state = { ...this.state, ...newState };
      this._update();
    }

    _update() {
      const oldVNode = this._vNode;
      const newVNode = this.render();
      this._vNode = newVNode;

      const newDom = reconcile(
        this._dom.parentNode,
        this._dom,
        oldVNode,
        newVNode,
      );
      this._dom = newDom;
    }

    render() {
      return null;
    }
  }

  function reconcile(parent, dom, oldVNode, newVNode) {
    if (!oldVNode) {
      const newDom = createDom(newVNode);
      newVNode.props.children.forEach((child) =>
        reconcile(newDom, null, null, child),
      );
      parent.appendChild(newDom);
      return newDom;
    } else if (!newVNode) {
      parent.removeChild(dom);
      return null;
    } else if (oldVNode.type !== newVNode.type) {
      const newDom = createDom(newVNode);
      parent.replaceChild(newDom, dom);
      newVNode.props.children.forEach((child) =>
        reconcile(newDom, null, null, child),
      );
      return newDom;
    } else {
      updateDom(dom, oldVNode.props, newVNode.props);
      const oldChildren = oldVNode.props.children;
      const newChildren = newVNode.props.children;
      const max = Math.max(oldChildren.length, newChildren.length);
      for (let i = 0; i < max; i++) {
        reconcile(dom, dom.childNodes[i], oldChildren[i], newChildren[i]);
      }
      return dom;
    }
  }

  // --- Hooks Implementation ---
  function useState(initialValue) {
    const instance = currentInstance;
    const index = hookIndex++;

    if (!instance.hooks[index]) {
      instance.hooks[index] = {
        state: initialValue,
        queue: [],
      };
    }

    const hook = instance.hooks[index];

    const setState = (action) => {
      hook.state = typeof action === "function" ? action(hook.state) : action;
      instance._update();
    };

    return [hook.state, setState];
  }

  function useEffect(callback, deps) {
    const instance = currentInstance;
    const index = hookIndex++;

    const oldHook = instance.hooks[index];
    const hasChanged =
      !deps || !oldHook || deps.some((dep, i) => dep !== oldHook.deps[i]);

    if (hasChanged) {
      if (oldHook && oldHook.cleanup) oldHook.cleanup();
      setTimeout(() => {
        const cleanup = callback();
        instance.hooks[index] = { deps, cleanup };
      });
    }
  }

  /**
   * --- Context API ---
   * Basic implementation of Context.
   * Note: In this basic version, nested providers of the same context are not supported.
   */
  function createContext(defaultValue) {
    const context = {
      _currentValue: defaultValue,
      Provider: ({ value, children }) => {
        context._currentValue = value;
        return children;
      },
    };
    return context;
  }

  function useContext(context) {
    return context._currentValue;
  }

  /**
   * --- Router API ---
   * Simple Hash-based Router
   */
  const Router = {
    Link: ({ to, children, ...props }) => {
      return createElement(
        "a",
        {
          ...props,
          href: `#${to}`,
        },
        children,
      );
    },

    View: ({ routes }) => {
      const [path, setPath] = useState(window.location.hash.slice(1) || "/");

      useEffect(() => {
        const handleHashChange = () => {
          setPath(window.location.hash.slice(1) || "/");
        };
        window.addEventListener("hashchange", handleHashChange);
        return () => window.removeEventListener("hashchange", handleHashChange);
      }, []);

      const activeRoute =
        routes.find((r) => r.path === path) ||
        routes.find((r) => r.path === "*");

      if (!activeRoute) {
        return createElement("div", null, "404 - Sayfa Bulunamadı");
      }

      return createElement(activeRoute.component);
    },
  };

  // --- Application Mounter ---
  function render(vNode, container) {
    if (typeof vNode.type === "function") {
      // Functional component or Class component
      const instance = new Component(vNode.props);
      // If it's a function, we override render
      instance.render = () => {
        currentInstance = instance;
        hookIndex = 0;
        return vNode.type(instance.props);
      };

      const initialVNode = instance.render();
      instance._vNode = initialVNode;
      const dom = createDom(initialVNode);
      instance._dom = dom;

      initialVNode.props.children.forEach((child) =>
        reconcile(dom, null, null, child),
      );
      container.appendChild(dom);
    } else {
      reconcile(container, null, null, vNode);
    }
  }

  return {
    createElement,
    render,
    useState,
    useEffect,
    createContext,
    useContext,
    Router,
    Component,
  };
})();

// For browser global use
window.V = V;
