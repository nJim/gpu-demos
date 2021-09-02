function more() {
  var elem = document.querySelector('.logo');
  for (let i = 0; i < 25; i++) {
    var clone = elem.cloneNode(true);
    elem.after(clone);
  }
}
