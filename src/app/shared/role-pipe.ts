import { Pipe, PipeTransform } from '@angular/core';

/**
 * Traduz códigos de roles (em inglês, como armazenados no backend) para
 * rótulos legíveis em português.
 *
 * Uso:
 *   {{ user.role | role }}                 → ex.: "Administrador"
 *   {{ user.role | role:'short' }}         → ex.: "Admin" (versão curta)
 */
@Pipe({
  name: 'role'
})
export class RolePipe implements PipeTransform {

  transform(value: string, format: 'long' | 'short' = 'long'): string {
    const maps: Record<'long' | 'short', Record<string, string>> = {
      long: {
        super_admin: 'Super Administrador',
        company_admin: 'Administrador da Empresa',
        administrator: 'Administrador',
        finance: 'Financeiro',
        default: 'Usuário Padrão'
      },
      short: {
        super_admin: 'Super Admin',
        company_admin: 'Admin Empresa',
        administrator: 'Admin',
        finance: 'Financeiro',
        default: 'Usuário'
      }
    };

    return maps[format]?.[value?.toLowerCase?.()] || value;
  }
}
