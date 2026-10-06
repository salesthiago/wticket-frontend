import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EditorModule, EditorInitEvent } from 'primeng/editor';
import { Observable } from 'rxjs';

export type RichTextImageUploader = (file: File) => Observable<{ url: string }>;

@Component({
  selector: 'app-rich-text-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, EditorModule],
  templateUrl: './rich-text-editor.component.html',
  styleUrl: './rich-text-editor.component.scss'
})
export class RichTextEditorComponent {
  @Input() value: string | null | undefined = '';
  @Input() placeholder = '';
  @Input() height = '220px';
  // Quando informado, o botão de imagem da barra de ferramentas faz upload
  // real do arquivo (em vez do padrão do Quill, que embutiria a imagem como
  // base64 dentro do próprio HTML salvo).
  @Input() uploader: RichTextImageUploader | null = null;

  @Output() valueChange = new EventEmitter<string>();
  @Output() uploadError = new EventEmitter<any>();

  onChange(html: string): void {
    this.value = html;
    this.valueChange.emit(html);
  }

  onEditorInit(event: EditorInitEvent): void {
    if (!this.uploader) return;
    const quill = event.editor;
    const toolbar = quill.getModule('toolbar');
    toolbar?.addHandler('image', () => this.pickAndUploadImage(quill));

    // Imagem colada (Ctrl+V) ou arrastada para o editor não passa pelo botão
    // da barra de ferramentas — o Quill a embute direto como base64. Sem isso,
    // esse base64 vai para o backend dentro do HTML salvo (payload gigante,
    // erro 413). Observa o conteúdo e substitui qualquer <img> base64 pela
    // URL real assim que ela é inserida, por qualquer via.
    quill.on('text-change', () => this.uploadEmbeddedImages(quill));
  }

  private pickAndUploadImage(quill: any): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file || !this.uploader) return;
      const range = quill.getSelection(true) || { index: quill.getLength(), length: 0 };
      this.uploader(file).subscribe({
        next: (res) => {
          quill.insertEmbed(range.index, 'image', res.url, 'user');
          quill.setSelection(range.index + 1, 0, 'user');
        },
        error: (err) => this.uploadError.emit(err)
      });
    };
    input.click();
  }

  private uploadEmbeddedImages(quill: any): void {
    if (!this.uploader) return;
    const images: HTMLImageElement[] = Array.from(quill.root.querySelectorAll('img[src^="data:"]'));
    for (const img of images) {
      if (img.dataset['uploading'] === '1') continue;
      const file = this.dataUrlToFile(img.getAttribute('src') || '');
      if (!file) continue;
      img.dataset['uploading'] = '1';
      this.uploader(file).subscribe({
        next: (res) => {
          const Ctor = quill.constructor;
          const blot = Ctor.find?.(img);
          if (blot) {
            const index = quill.getIndex(blot);
            quill.deleteText(index, 1, 'user');
            quill.insertEmbed(index, 'image', res.url, 'user');
          } else {
            img.setAttribute('src', res.url);
          }
        },
        error: (err) => {
          delete img.dataset['uploading'];
          this.uploadError.emit(err);
        }
      });
    }
  }

  private dataUrlToFile(dataUrl: string): File | null {
    const match = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
    if (!match) return null;
    const mime = match[1];
    const binary = atob(match[2]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const ext = mime.split('/')[1]?.split('+')[0] || 'png';
    return new File([bytes], `imagem-colada.${ext}`, { type: mime });
  }
}
