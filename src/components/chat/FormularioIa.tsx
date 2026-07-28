/**
 * O mini-formulário que a IA abre dentro do chat quando o visitante aceita
 * um convite. Os campos vêm da especificação (ia/formularios.ts), então esta
 * peça não sabe nada sobre reforma tributária — só desenha e devolve valores.
 */

import { useState } from 'react'
import {
  valoresIniciais,
  type EspecFormulario,
  type CampoIa,
  type ValoresForm,
} from '../../ia/formularios'
import { MarcaIa } from './Mensagem'

export function FormularioIa({
  spec,
  onEnviar,
  onCancelar,
  ocupado,
}: {
  spec: EspecFormulario
  onEnviar: (valores: ValoresForm) => void
  onCancelar: () => void
  ocupado: boolean
}) {
  const [valores, setValores] = useState<ValoresForm>(() => valoresIniciais(spec))
  const mudar = (id: string, v: string | number | boolean) => setValores((a) => ({ ...a, [id]: v }))

  return (
    <form
      className="ia-form"
      onSubmit={(e) => {
        e.preventDefault()
        if (!ocupado) onEnviar(valores)
      }}
    >
      <p className="ia-form-cab">
        <span className="ia-form-marca" aria-hidden>
          <MarcaIa />
        </span>
        <strong>{spec.titulo}</strong>
        <span className="ia-form-resumo">{spec.resumo}</span>
      </p>

      <div className="ia-form-campos">
        {spec.campos.map((campo) => (
          <Campo key={campo.id} campo={campo} valor={valores[campo.id]} onMudar={(v) => mudar(campo.id, v)} />
        ))}
      </div>

      <div className="ia-form-acoes">
        <button type="button" className="ia-form-cancelar" onClick={onCancelar} disabled={ocupado}>
          Deixa pra lá
        </button>
        <button type="submit" className="botao-acao" disabled={ocupado}>
          {spec.acao}
        </button>
      </div>
    </form>
  )
}

function Campo({
  campo,
  valor,
  onMudar,
}: {
  campo: CampoIa
  valor: string | number | boolean
  onMudar: (v: string | number | boolean) => void
}) {
  if (campo.tipo === 'simNao') {
    return (
      <div className="ia-campo ia-campo-simnao">
        <span className="ia-campo-rotulo">{campo.rotulo}</span>
        <div className="segmentado" role="group" aria-label={campo.rotulo}>
          <button type="button" className={valor === true ? 'on' : ''} onClick={() => onMudar(true)}>
            Sim
          </button>
          <button type="button" className={valor === false ? 'on' : ''} onClick={() => onMudar(false)}>
            Não
          </button>
        </div>
      </div>
    )
  }

  if (campo.tipo === 'escolha') {
    return (
      <label className="ia-campo">
        <span className="ia-campo-rotulo">{campo.rotulo}</span>
        <select value={String(valor)} onChange={(e) => onMudar(e.target.value)}>
          {campo.opcoes.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.rotulo}
            </option>
          ))}
        </select>
      </label>
    )
  }

  return (
    <label className="ia-campo">
      <span className="ia-campo-rotulo">{campo.rotulo}</span>
      <span className="entrada-num">
        {campo.prefixo && <span className="entrada-prefixo">{campo.prefixo}</span>}
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step={campo.passo ?? 1}
          value={Number.isFinite(Number(valor)) ? Number(valor) : ''}
          onChange={(e) => onMudar(e.target.valueAsNumber || 0)}
        />
      </span>
    </label>
  )
}
