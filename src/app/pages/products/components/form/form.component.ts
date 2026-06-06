import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService, MenuItem, ConfirmationService } from 'primeng/api';
import { ProductsService } from '../services/products.service';
import { ProductModel, ProductImage, StockMovement } from '../../product.interface';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { Toast } from 'primeng/toast';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../../../layout/sidebar/sidebar.component';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { CommonModule } from '@angular/common';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-form',
  standalone: true,
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
  providers: [MessageService, ConfirmationService],
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    SelectModule,
    Toast,
    FormsModule,
    SidebarComponent,
    BreadcrumbModule,
    ToggleSwitch,
    ConfirmDialogModule,
    TooltipModule,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    TableModule,
    TagModule
  ]
})
export class FormComponent implements OnInit {
  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [{ label: 'Produtos', routerLink: '/products' }, { label: 'Novo Produto' }];

  public product: ProductModel = {
    name: '',
    sku: '',
    ncmCode: '',
    brand: '',
    model: '',
    description: '',
    price: 0,
    stock: 0,
    isActive: true,
    isVirtual: false,
    service: false,
    trackStock: true,
    downloadUrl: ''
  };

  public activeTab = 'cadastro';
  public images: ProductImage[] = [];
  public loading = false;
  public uploadingImage = false;

  // ─── Estoque ───────────────────────────────────────────────────────────────
  public movements: StockMovement[] = [];
  public loadingMovements = false;
  public savingMovement = false;
  public movementDraft: { type: 'in' | 'out'; quantity: number; notes: string } = {
    type: 'in',
    quantity: 1,
    notes: ''
  };
  public optionMovementType = [
    { name: 'Entrada', value: 'in' },
    { name: 'Saída', value: 'out' }
  ];

  public get showStockTab(): boolean {
    return !!this.id && !this.product.isVirtual && this.product.trackStock !== false;
  }

  public optionStatus = [
    { name: 'Ativo', value: true },
    { name: 'Inativo', value: false }
  ];

  protected id: string | null = null;

  constructor(
    private service: ProductsService,
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private route: ActivatedRoute
  ) {
    this.id = this.route.snapshot.paramMap.get('id');
    if (this.id) {
      this.findById(this.id);
      this.loadImages(this.id);
      this.loadStockMovements(this.id);
    }
  }

  ngOnInit(): void {
    this.breadcrumbItems = [
      { label: 'Produtos', routerLink: '/products' },
      { label: this.id ? 'Editar Produto' : 'Novo Produto' }
    ];
  }

  private findById(id: string) {
    this.loading = true;
    this.service.findById(id).subscribe({
      next: (resp: any) => {
        this.product = {
          ...resp,
          id: resp._id,
          trackStock: resp.trackStock !== undefined ? resp.trackStock : true,
          isVirtual: resp.isVirtual || false,
          downloadUrl: resp.downloadUrl || ''
        };
        this.loading = false;
      },
      error: (error: any) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: error?.error?.message || 'Erro ao buscar produto'
        });
      }
    });
  }

  private loadImages(productId: string) {
    this.service.getImages(productId).subscribe({
      next: (imgs: ProductImage[]) => {
        this.images = imgs;
      }
    });
  }

  public onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length || !this.id) {
      if (!this.id) {
        this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Salve o produto antes de adicionar imagens.' });
      }
      return;
    }
    const file = input.files[0];
    this.uploadingImage = true;
    this.service.uploadImage(this.id, file).subscribe({
      next: (img: ProductImage) => {
        this.images.push(img);
        this.uploadingImage = false;
        this.messageService.add({ severity: 'success', summary: 'OK', detail: 'Imagem adicionada!' });
        input.value = '';
      },
      error: (err: any) => {
        this.uploadingImage = false;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message || 'Erro ao enviar imagem' });
      }
    });
  }

  public setMainImage(imageId: string) {
    if (!this.id) return;
    this.service.setMainImage(this.id, imageId).subscribe({
      next: (resp: any) => {
        this.product.mainImage = resp.mainImage;
        this.messageService.add({ severity: 'success', summary: 'OK', detail: 'Imagem principal definida!' });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao definir imagem principal.' });
      }
    });
  }

  public confirmDeleteImage(event: Event, imageId: string) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Deseja remover esta imagem?',
      header: 'Confirmar',
      icon: 'pi pi-trash',
      acceptButtonProps: { label: 'Remover', severity: 'danger' },
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', outlined: true },
      accept: () => this.deleteImage(imageId)
    });
  }

  private deleteImage(imageId: string) {
    this.service.deleteImage(imageId).subscribe({
      next: () => {
        this.images = this.images.filter(i => i._id !== imageId);
        if ((this.product.mainImage as any)?._id === imageId || this.product.mainImage === imageId as any) {
          this.product.mainImage = undefined;
        }
        this.messageService.add({ severity: 'success', summary: 'OK', detail: 'Imagem removida!' });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao remover imagem.' });
      }
    });
  }

  // ─── Estoque ───────────────────────────────────────────────────────────────

  private loadStockMovements(productId: string) {
    this.loadingMovements = true;
    this.service.listStockMovements(productId, { limit: 50 }).subscribe({
      next: (resp: any) => {
        this.movements = resp?.records ?? resp ?? [];
        this.loadingMovements = false;
      },
      error: () => {
        this.loadingMovements = false;
      }
    });
  }

  public submitStockMovement() {
    if (!this.id) return;
    if (!this.movementDraft.quantity || this.movementDraft.quantity <= 0) {
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Informe uma quantidade maior que zero.' });
      return;
    }

    this.savingMovement = true;
    this.service.createStockMovement(this.id, {
      type: this.movementDraft.type,
      quantity: this.movementDraft.quantity,
      notes: this.movementDraft.notes || undefined
    }).subscribe({
      next: (resp: any) => {
        this.savingMovement = false;
        if (resp?.product) this.product.stock = resp.product.stock;
        this.messageService.add({
          severity: 'success',
          summary: 'OK',
          detail: this.movementDraft.type === 'in' ? 'Entrada registrada!' : 'Saída registrada!'
        });
        this.movementDraft = { type: 'in', quantity: 1, notes: '' };
        this.loadStockMovements(this.id!);
      },
      error: (err: any) => {
        this.savingMovement = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: err?.error?.message || 'Erro ao registrar movimentação'
        });
      }
    });
  }

  public movementTypeLabel(m: StockMovement): string {
    return m.type === 'in' ? 'Entrada' : 'Saída';
  }

  public movementReasonLabel(m: StockMovement): string {
    const labels: Record<string, string> = {
      manual_in: 'Entrada manual',
      manual_out: 'Saída manual',
      service_order: 'Ordem de serviço',
      service_order_reversal: 'Estorno de OS',
      adjustment: 'Ajuste'
    };
    return labels[m.reason] ?? m.reason;
  }

  public movementUser(m: StockMovement): string {
    if (!m.createdBy) return '—';
    return typeof m.createdBy === 'string' ? '—' : (m.createdBy.name || '—');
  }

  public isMainImage(image: ProductImage): boolean {
    if (!this.product.mainImage) return false;
    const mainId = (this.product.mainImage as any)?._id || this.product.mainImage;
    return mainId === image._id;
  }

  public onSubmit(): void {
    if (!this.product.name || this.product.name.trim().length < 2) {
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Nome inválido' });
      return;
    }
    if (!this.product.sku || this.product.sku.trim().length < 2) {
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'SKU inválido' });
      return;
    }
    if (this.product.price == null || this.product.price < 0) {
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Preço inválido' });
      return;
    }

    this.loading = true;

    const payload = {
      name: this.product.name,
      sku: this.product.sku,
      ncmCode: this.product.ncmCode,
      brand: this.product.brand,
      model: this.product.model,
      description: this.product.description,
      price: this.product.price,
      stock: this.product.stock,
      isActive: this.product.isActive,
      isVirtual: this.product.isVirtual,
      service: this.product.service,
      trackStock: this.product.trackStock,
      downloadUrl: this.product.isVirtual ? this.product.downloadUrl : undefined
    };

    if (this.id) {
      this.service.update(payload, this.id).subscribe({
        next: (resp: any) => {
          this.loading = false;
          this.product = { ...this.product, ...resp, id: resp._id };
          this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Produto atualizado!' });
        },
        error: (error: any) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: error?.error?.message || 'Erro ao atualizar produto'
          });
        }
      });
    } else {
      this.service.create(payload).subscribe({
        next: (resp: any) => {
          this.loading = false;
          this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Produto criado!' });
          this.router.navigate(['/products/edit', resp._id]);
        },
        error: (error: any) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: error?.error?.message || 'Erro ao criar produto'
          });
        }
      });
    }
  }

  // Ao marcar como serviço: marca/modelo/estoque ficam vazios e ocultos,
  // e o controle de estoque é desativado.
  public onServiceChange(value: boolean): void {
    this.product.service = value;
    if (value) {
      this.product.brand = '';
      this.product.model = '';
      this.product.stock = 0;
      this.product.trackStock = false;
    }
  }

  public onBack() {
    this.router.navigate(['/products']);
  }
}
