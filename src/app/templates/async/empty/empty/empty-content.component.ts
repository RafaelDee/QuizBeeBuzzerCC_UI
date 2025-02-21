import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'empty',
  standalone:true,
  template: `
    <div
      class="d-flex justify-content-center align-items-center flex-column text-center "
    >
      <h1><i class="fa-regular fa-folder-open fa-2x  mb-2"></i></h1>
      <h5 class="fw-bold">Nothing Here</h5>
      <div>poof!</div>
    </div>
  `,
  styles: [],
})
export class EmptyContentComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
