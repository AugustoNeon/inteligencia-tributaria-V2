import { useEffect, useState } from 'react'
import { CabecalhoPagina } from '../components/layout/Shell'
import { Callout, Campo, Segmentado } from '../components/ui/kit'
import { IA_URL } from '../ia/config'
import { statusIa } from '../ia/cliente'

/**
 * Interruptor do assistente de IA — rota escondida (sem link na navegação).
 * Liga por tempo limitado e DESLIGA SOZINHA (TTL no worker): impossível
 * esquecer a IA acesa gerando custo.
 */
export function AdminIA() {
  const [senha, setSenha] = useState('')
  const [horas, setHoras] = useState('2')
  const [estado, setEstado] = useState<{ ligada: boolean; expira: string | null } | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  useEffect(() => {
    void statusIa().then(setEstado)
  }, [])

  const acionar = async (acao: 'ligar' | 'desligar') => {
    if (!IA_URL) {
      setAviso('Worker ainda não configurado (IA_URL vazia em src/ia/config.ts).')
      return
    }
    setOcupado(true)
    setAviso(null)
    try {
      const resp = await fetch(`${IA_URL}/admin`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ senha, acao, horas: Number(horas) }),
      })
      if (resp.status === 401) {
        setAviso('Senha incorreta.')
      } else if (resp.status === 429) {
        setAviso('Muitas tentativas — aguarde uma hora.')
      } else if (!resp.ok) {
        setAviso(`Falha (HTTP ${resp.status}).`)
      } else {
        const dados = (await resp.json()) as { ligada: boolean; expira: string | null }
        setEstado(dados)
        setAviso(dados.ligada ? 'IA ligada.' : 'IA desligada.')
      }
    } catch {
      setAviso('Não consegui falar com o worker.')
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div className="page-enter">
      <CabecalhoPagina
        kicker="admin://interruptor-da-ia"
        titulo="Interruptor do assistente"
        descricao="Liga a IA por tempo limitado — ela desliga sozinha quando o prazo vence. Desligada, o worker nem chama a API: custo zero."
      />
      <div className="conteudo">
        <div className="admin-ia">
          {estado && (
            <p className="admin-estado">
              Estado agora:{' '}
              {estado.ligada ? (
                <>
                  <strong>ligada</strong>
                  {estado.expira && ` — desliga sozinha em ${new Date(estado.expira).toLocaleString('pt-BR')}`}
                </>
              ) : (
                <strong>desligada</strong>
              )}
            </p>
          )}

          <Campo label="Senha do administrador">
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="current-password"
              aria-label="Senha do administrador"
            />
          </Campo>

          <Campo label="Ligar por quanto tempo?">
            <Segmentado
              ariaLabel="Duração"
              opcoes={[
                { valor: '1', rotulo: '1h' },
                { valor: '2', rotulo: '2h' },
                { valor: '4', rotulo: '4h' },
                { valor: '8', rotulo: '8h' },
              ]}
              valor={horas}
              onMudar={setHoras}
            />
          </Campo>

          <div className="admin-acoes">
            <button className="botao-acao" onClick={() => void acionar('ligar')} disabled={ocupado || !senha}>
              Ligar a IA
            </button>
            <button className="botao-acao" onClick={() => void acionar('desligar')} disabled={ocupado || !senha}>
              Desligar agora
            </button>
          </div>

          {aviso && (
            <p className="admin-aviso" role="status">
              {aviso}
            </p>
          )}

          <Callout tom="info" titulo="Como funciona">
            <ul>
              <li>O interruptor vive no worker (Cloudflare KV) com prazo de validade — vencido o prazo, a chave some e a IA desliga sem depender de ninguém.</li>
              <li>Com a IA desligada o visitante vê o chat em "modo demonstração" e o site inteiro continua funcionando normalmente.</li>
              <li>Mesmo ligada, há limite de perguntas por visitante e um teto global diário.</li>
            </ul>
          </Callout>
        </div>
      </div>
    </div>
  )
}
