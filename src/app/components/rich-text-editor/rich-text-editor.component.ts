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
}
