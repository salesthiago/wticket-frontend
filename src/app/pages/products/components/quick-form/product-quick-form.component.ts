import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { ProductsService } from '../services/products.service';
import { ProductModel } from '../../product.interface';

// Modal reutilizável para cadastro rápido de produto (peça) ou serviço.
// O SKU é opcional: se ficar vazio, o backend gera um código automaticamente.
@Component({
  selector: 'app-product-quick-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule, DialogModule, ButtonModule,
    InputTextModule, InputNumberModule, TextareaModule
  ],
  template: `
    <p-dialog [visible]="visible" (visibleChange)="onVisibleChange($event)" [modal]="true"
              [style]="{ width: '32rem' }" [contentStyle]="{ overflow: 'visible' }"
              [header]="isService ? 'Novo serviço' : 'Novo produto'" [draggable]="false">
      <div class="grid grid-cols-2 gap-4 pt-1">
        <div class="field col-span-2">
          <label class="block mb-2">Nome <span class="text-red-500">*</span></label>
          <input pInputText [(ngModel)]="product.name"
                 [placeholder]="isService ? 'Descrição do serviço' : 'Nome do produto / peça'" class="w-full" />
        </div>

        <div class="field col-span-2">
          <label class="block mb-2">SKU / Código</label>
          <input pInputText [(ngModel)]="product.sku"
                 placeholder="Deixe em branco para gerar automaticamente" class="w-full" style="text-transform: uppercase" />
        </div>

        <div class="field" [class.col-span-2]="isService">
          <label class="block mb-2">{{ isService ? 'Valor' : 'Preço de venda' }} <span class="text-red-500">*</span></label>
          <p-inputNumber [(ngModel)]="product.price" mode="currency" currency="BRL" locale="pt-BR" [min]="0" class="w-full" />
        </div>

        @if (!isService) {
          <div class="field">
            <label class="block mb-2">Marca</label>
            <input pInputText [(ngModel)]="product.brand" placeholder="Opcional" class="w-full" />
          </div>
          <div class="field col-span-2">
            <label class="block mb-2">Modelo</label>
            <input pInputText [(ngModel)]="product.model" placeholder="Opcional" class="w-full" />
          </div>
        }

        <div class="field col-span-2">
          <label class="block mb-2">Descrição</label>
          <textarea pTextarea [(ngModel)]="product.description" rows="2" class="w-full"></textarea>
        </div>
      </div>

      <ng-template #footer>
        <p-button label="Cancelar" severity="secondary" [text]="true" (click)="close()" />
        <p-button [label]="isService ? 'Cadastrar serviço' : 'Cadastrar produto'" icon="pi pi-check"
                  [loading]="saving" (click)="save()" />
      </ng-template>
    </p-dialog>
  `
})
export class ProductQuickFormComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() mode: 'part' | 'service' = 'part';
  @Output() created = new EventEmitter<ProductModel>();

  saving = false;
  product: Partial<ProductModel> = this.empty();

  constructor(
    private productsService: ProductsService,
    private messageService: MessageService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.product = this.empty();
    }
  }

  get isService(): boolean {
    return this.mode === 'service';
  }

  private empty(): Partial<ProductModel> {
    return { name: '', sku: '', price: 0, brand: '', model: '', description: '' };
  }

  onVisibleChange(value: boolean): void {
    this.visible = value;
    this.visibleChange.emit(value);
  }

  close(): void {
    this.onVisibleChange(false);
  }

  save(): void {
    if (!this.product.name || this.product.name.trim().length < 2) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Informe o nome.' });
      return;
    }
    if (this.product.price == null || this.product.price < 0) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Informe um valor válido.' });
      return;
    }

    const payload: any = {
      name: this.product.name.trim(),
      price: this.product.price,
      description: this.product.description,
      service: this.isService,
      trackStock: this.isService ? false : true,
      stock: 0
    };
    if (this.product.sku && this.product.sku.trim()) {
      payload.sku = this.product.sku.trim();
    }
    if (!this.isService) {
      payload.brand = this.product.brand || undefined;
      payload.model = this.product.model || undefined;
    }

    this.saving = true;
    this.productsService.create(payload).subscribe({
      next: (created: ProductModel) => {
        this.saving = false;
        this.messageService.add({
          severity: 'success', summary: 'Sucesso',
          detail: this.isService ? 'Serviço cadastrado.' : 'Produto cadastrado.'
        });
        this.created.emit(created);
        this.close();
      },
      error: (err: any) => {
        this.saving = false;
        this.messageService.add({
          severity: 'error', summary: 'Erro',
          detail: err?.error?.message || 'Falha ao cadastrar.'
        });
      }
    });
  }
}
