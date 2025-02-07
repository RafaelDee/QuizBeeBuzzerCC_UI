//using @types/bootstrap breaks the bootstrap CDN
//this script helps to communicate with bootstrap without breaking it
var tooltips = [];

export function Tooltip(element) {
  tooltips.push(new bootstrap.Tooltip(element));
}
export function Carousel(element) {
  return new bootstrap.Carousel(element);
}
export function Dropdown(element) {
  return new bootstrap.Dropdown(element);
}
export function Popover(element,options = null) {
  return new bootstrap.Popover(element,options)
}
export function Modal(element){
  return new bootstrap.Modal(element);
}
export function Tab(element){
  return new bootstrap.Tab(element);
}
