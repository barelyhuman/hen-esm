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
  const delimeter = "%";
  return {
    getItem(_) {
      const hash = window.location.hash.slice(1);
      const splits = hash.split("--").filter(Boolean);
      let result;
      splits.forEach((s) => {
        const [name, value] = s.split(delimeter);
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
      let finalString = splits
        .map((s) => {
          const [name] = s.split(delimeter);
          if (name == paramName) {
            added = true;
            return `${name}${delimeter}${btoa(data)}`;
          }
          return s;
        })
        .join("--");
      if (!added) {
        finalString =
          finalString +
          (finalString.length > 0 ? "--" : "") +
          `${paramName}${delimeter}${btoa(data)}`;
      }
      window.location.hash = finalString;
    },
  };
}

export const jsStore = new Store("");
export const cssStore = new Store("");
