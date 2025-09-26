export const FormErrorMessages = {
    required: 'Este campo é obrigatório',
    email: 'Por favor, insira um e-mail válido',
    minlength: (params: any) => `Este campo deve ter no mínimo ${params.requiredLength} caracteres`,
    maxlength: (params: any) => `Este campo deve ter no máximo ${params.requiredLength} caracteres`,
    pattern: 'Este campo contém um formato inválido',
};

export type FormErrosMessages = typeof FormErrorMessages;
