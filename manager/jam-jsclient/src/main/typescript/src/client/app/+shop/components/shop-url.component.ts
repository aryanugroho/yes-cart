/*
 * Copyright 2009 - 2016 Denys Pavlov, Igor Azarnyi
 *
 *    Licensed under the Apache License, Version 2.0 (the 'License');
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an 'AS IS' BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */
import {Component, OnInit, OnDestroy, OnChanges, Input} from '@angular/core';
import {NgIf, NgFor, CORE_DIRECTIVES } from '@angular/common';
import {FormBuilder, Validators, REACTIVE_FORM_DIRECTIVES} from '@angular/forms';
import {PaginationComponent} from './../../shared/pagination/index';
import {ShopVO, ShopUrlVO, UrlVO} from './../../shared/model/index';
import {ShopService, ShopEventBus, Util} from './../../shared/services/index';
import {DataControlComponent} from './../../shared/sidebar/index';
import {ModalComponent, ModalResult, ModalAction} from './../../shared/modal/index';
import {YcValidators} from './../../shared/validation/validators';

@Component({
  selector: 'shop-url',
  moduleId: module.id,
  templateUrl: 'shop-url.component.html',
  directives: [DataControlComponent, PaginationComponent, REACTIVE_FORM_DIRECTIVES, CORE_DIRECTIVES, ModalComponent]
})

export class ShopUrlComponent implements OnInit, OnChanges {

  @Input() shop:ShopVO;

  //paging
  maxSize:number = 5;
  itemsPerPage:number = 10;
  totalItems:number = 0;
  currentPage:number = 1;


  shopUrl:ShopUrlVO;

  changed:boolean = false;
  validForSave:boolean = false;

  deleteConfirmationModalDialog:ModalComponent;
  editUrlModalDialog:ModalComponent;


  urlToDelete:string ;
  urlToEdit:UrlVO = {'urlId': 0, 'url': '', 'theme' : ''} ;

  shopUrlForm:any;
  shopUrlListForm:any;

  /**
   * Construct shop url panel
   *
   * @param _shopService shop service
   */
  constructor(private _shopService:ShopService,
              fb: FormBuilder) {
    console.debug('ShopUrlComponent constructed');

    this.shopUrlForm = fb.group({
      'url': ['', Validators.compose([Validators.required, YcValidators.validDomainName])],
      'theme': [''],
    });

    this.shopUrlListForm = fb.group({
      'pager': [''],
    })
  }


  formReset():void {
    // Hack to reset NG2 forms see https://github.com/angular/angular/issues/4933
    for(let key in this.shopUrlForm.controls) {
      this.shopUrlForm.controls[key]['_pristine'] = true;
      this.shopUrlForm.controls[key]['_touched'] = false;
    }
  }

  /** {@inheritDoc} */
  public ngOnInit() {
    console.debug('ShopUrlComponent ngOnInit shop', this.shop);
    this.onRefreshHandler();
  }

  ngOnChanges(changes:any) {
    console.log('ShopUrlComponent ngOnChanges', changes);
    this.onRefreshHandler();
  }

  /**
   * Row delete handler.
   * @param row url to delete.
   */
  protected onRowDelete(row:UrlVO) {
    console.debug('ShopUrlComponent onRowDelete handler', row);
    this.urlToDelete = row.url;
    this.deleteConfirmationModalDialog.show();
  }

  protected onRowEdit(row:UrlVO) {
    console.debug('ShopUrlComponent onRowEdit handler', row);
    this.formReset();
    this.validForSave = false;
    this.urlToEdit = Util.clone(row) ;
    this.editUrlModalDialog.show();
  }

  protected onRowNew() {
    console.debug('ShopUrlComponent onRowNew handler');
    this.formReset();
    this.validForSave = false;
    this.urlToEdit = Util.clone({'urlId': 0, 'url': '', 'theme' : ''});
    this.editUrlModalDialog.show();
  }


  onDataChange(event:any) {
    var _sub:any = this.shopUrlForm.valueChanges.subscribe((data:any) => {
      this.validForSave = this.shopUrlForm.valid;
      console.debug('ShopUrlComponent form changed  and ' + (this.validForSave ? 'is valid' : 'is NOT valid'), data);
      _sub.unsubscribe();
    });
    console.debug('ShopUrlComponent data changed and ' + (this.validForSave ? 'is valid' : 'is NOT valid'), event);
  }

  protected onSaveHandler() {
    console.debug('ShopUrlComponent Save handler', this.shop);
    if (this.shop.shopId > 0 && this.shopUrl) {
      var _sub:any = this._shopService.saveShopUrls(this.shopUrl).subscribe(
          rez => {
          this.shopUrl = rez;
          this.changed = false;
          this.totalItems = this.shopUrl.urls.length;
          this.currentPage = 1;
          console.debug('ShopUrlComponent totalItems:' + this.totalItems + ', itemsPerPage:' + this.itemsPerPage);
          _sub.unsubscribe();
        }
      );
    }
  }

  protected onDiscardEventHandler() {
    console.debug('ShopUrlComponent discard handler', this.shop);
    this.onRefreshHandler();
  }

  protected onRefreshHandler() {
    console.debug('ShopUrlComponent refresh handler', this.shop);
    this.getShopUrls();
  }

  protected deleteConfirmationModalDialogLoaded(modal: ModalComponent) {
    console.debug('ShopUrlComponent deleteConfirmationModalDialogLoaded');
    // Here you get a reference to the modal so you can control it programmatically
    this.deleteConfirmationModalDialog = modal;
  }

  protected editUrlModalLoaded(modal: ModalComponent) {
    console.debug('ShopUrlComponent editUrlModalLoaded');
    this.editUrlModalDialog = modal;
  }

  protected onDeleteConfirmationResult(modalresult: ModalResult) {
    console.debug('ShopUrlComponent onDeleteConfirmationResult modal result is ', modalresult);
    if (ModalAction.POSITIVE === modalresult.action) {
      let idx = this.shopUrl.urls.findIndex(urlVo =>  {return urlVo.url === this.urlToDelete;} );
      console.debug('ShopUrlComponent onDeleteConfirmationResult index in array of urls ' + idx);
      this.shopUrl.urls.splice(idx, 1);
      this.changed = true;
    }
  }

  protected onEditUrlModalResult(modalresult: ModalResult) {
    console.debug('ShopUrlComponent onEditUrlModalResult modal result is ', modalresult);
    if (ModalAction.POSITIVE === modalresult.action) {
      if (this.urlToEdit.urlId === 0) { // add new
        console.debug('ShopUrlComponent onEditUrlModalResult add new url', this.shopUrl);
        this.shopUrl.urls.push(this.urlToEdit);
        this.totalItems++;
      } else { // edit existing
        console.debug('ShopUrlComponent onEditUrlModalResult update existing', this.shopUrl);
        let idx = this.shopUrl.urls.findIndex(urlVo =>  {return urlVo.urlId === this.urlToEdit.urlId;} );
        this.shopUrl.urls[idx] = this.urlToEdit;
      }
      this.changed = true;
    }
  }

  /**
   * Read urls, that belong to shop.
   */
  private getShopUrls() {
    console.debug('ShopUrlComponent get urls', this.shop);
    if (this.shop.shopId > 0) {

      this._shopService.getShopUrls(this.shop.shopId).subscribe(shopUrl => {

        console.debug('ShopUrlComponent urls', this.shopUrl);
        this.shopUrl = shopUrl;
        this.changed = false;

        this.totalItems = this.shopUrl.urls.length;
        this.currentPage = 1;
        console.debug('ShopUrlComponent totalItems:' + this.totalItems + ', itemsPerPage:' + this.itemsPerPage);

      });
    } else {
      this.shopUrl = null;
    }
  }

}
