export interface Filme {
  id: number;
  titulo: string;
  genero?: string;
  ano?: number;
  sinopse?: string;
  imagemUrl?: string;
}

export interface Cliente {
  id?: number;
  nome: string;
  email: string;
}
