export function debounce(fn, delay) {
    let id;
    return (...args) => {
      if (id) clearTimeout(id);
      id = setTimeout(() => {
        fn(...args);
        clearTimeout(id);
      }, delay);
    };
  }

  export function copyToClipboard(strToCopy) {
    if (!navigator.clipboard) {
      return fallBackCopy(strToCopy);
    }
    navigator.permissions
      .query({ name: "clipboard-write" })
      .then((result) => {
        if (result.state == "granted" || result.state == "prompt") {
          navigator.clipboard.writeText(strToCopy).then(
            function () {
              // ignore and digest
            },
            function () {
              return fallBackCopy(strToCopy);
            }
          );
        } else {
          return fallBackCopy(strToCopy);
        }
      })
      .catch((err) => {
        return fallBackCopy(strToCopy);
      });
  }
  
  function fallBackCopy(strToCopy) {
    const el = document.createElement("textarea");
    el.value = strToCopy;
    el.setAttribute("readonly", "");
    el.style.position = "absolute";
    el.style.left = "-9999px";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  }