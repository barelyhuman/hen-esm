import "toastify-js/src/toastify.css";
import Toastify from "toastify-js";



export const toast = {
  success(msg) {
    return Toastify({
      text: msg,
      className: "toast success",
      style:{
        background:"inherit"
      }
    }).showToast();
  },
  error(msg) {
    return Toastify({
      text: msg,
      className: "toast error",
      style:{
        background:"inherit"
      }
    }).showToast();
  },
};
