import { nanoid } from "nanoid";

type Listener<T> = (v: T) => void;

class Store<T> {
  #data: T;
  #listeners: Map<string, Listener<T>> = new Map();

  constructor(initialData: T) {
    this.#data = initialData;
  }
  get data() {
    return this.#data;
  }
  set data(val) {
    this.#data = val;
    for (let o of this.#listeners) {
      o[1](val);
    }
  }
  subscribe(fn: Listener<T>) {
    const key = nanoid();
    this.#listeners.set(key, fn);
    return () => {
      this.#listeners.delete(key);
    };
  }
  persist(name, storage) {
    this.subscribe((d) => {
      storage.setItem(name, d);
    });
  }
  load(name, storage) {
    this.#data = storage.getItem(name);
  }
}

export function createURLPersistanceStore(paramName: string) {
  return {
    getItem(_) {
      const hash = window.location.hash.slice(1);
      const splits = hash.split("--");
      let result;
      splits.forEach((s) => {
        const [name, value] = s.split("=");
        if (name == paramName) {
          result = atob(value);
        }
      });
      return result;
    },
    setItem(_, data) {
      const currentHash = window.location.hash.slice(1);
      const splits = currentHash.split("--");
      let added = false;
      const finalString = splits
        .map((s) => {
          const [name] = s.split("=");
          if (name == paramName) {
            added = true;
            return `${name}=${btoa(data)}`;
          }
          return s;
        })
        .join("--");
      if (!added) {
        window.location.hash = finalString + `--${paramName}=${btoa(data)}`;
      }
    },
  };
}

export const jsStore = new Store("");
export const cssStore = new Store("");
