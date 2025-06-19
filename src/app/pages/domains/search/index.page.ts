import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '~/app/prime-ng.module';
import DatabaseService from '~/app/services/database.service';
import { ErrorHandlerService } from '~/app/services/error-handler.service';

@Component({
  standalone: true,
  imports: [PrimeNgModule, CommonModule],
  template: ``,
})
export default class SearchPageComponent implements OnInit {
  loading: boolean = true;

  constructor(
    private databaseService: DatabaseService,
    private errorHandlerService: ErrorHandlerService,
  ) {}

  ngOnInit() {

  }

}
