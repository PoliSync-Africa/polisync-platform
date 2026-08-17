
document.addEventListener("DOMContentLoaded", () => {

  const signIn = document.querySelector(".signin");
  const google = document.querySelector(".google");
  const apple = document.querySelector(".apple");

  signIn.addEventListener("click", () => {
    alert("Welcome to PoliSync Africa. Authentication will be connected soon.");
  });

  google.addEventListener("click", () => {
    alert("Google Sign-In coming soon.");
  });

  apple.addEventListener("click", () => {
    alert("Apple Sign-In coming soon.");
  });

});
