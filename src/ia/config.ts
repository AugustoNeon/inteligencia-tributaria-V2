/**
 * URL do worker (proxy da IA na Cloudflare). Preenchida no primeiro deploy
 * do worker; vazia = a IA aparece em modo demonstração e nada é chamado.
 * A chave da API NUNCA fica no site — vive como secret dentro do worker.
 */
export const IA_URL: string = 'https://ia-tributaria.augustoneonvazryba.workers.dev'
