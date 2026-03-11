import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService, MenuItem, ConfirmationService } from 'primeng/api';
import { ProductsService } from '../services/products.service';
import { ProductModel, ProductImage } from '../../product.interface';
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
    TabPanel
  ]
})
export class FormComponent implements OnInit {
  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [{ label: 'Produtos', routerLink: '/products' }, { label: 'Novo Produto' }];

  public product: ProductModel = {
    name: '',
    sku: '',
    ncmCode: '',
    description: '',
    price: 0,
    stock: 0,
    isActive: true,
    isVirtual: false,
    trackStock: true,
    downloadUrl: ''
  };

  public activeTab = 'cadastro';
  public images: ProductImage[] = [];
  public loading = false;
  public uploadingImage = false;

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
      description: this.product.description,
      price: this.product.price,
      stock: this.product.stock,
      isActive: this.product.isActive,
      isVirtual: this.product.isVirtual,
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

  public onBack() {
    this.router.navigate(['/products']);
  }
}
