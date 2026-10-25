package oficina.dominio;

import java.util.Objects;

/** Dados imutáveis de um item do backlog; prioridade e status têm valores conhecidos. */
public record Chamado(long id, String titulo, String equipe, Prioridade prioridade, Status status) {
    // A ordem de prioridade é explícita, sem depender da posição do enum.
    public enum Prioridade {
        CRITICA(0), ALTA(1), MEDIA(2), BAIXA(3);

        private final int ordemAtendimento;

        Prioridade(int ordemAtendimento) {
            this.ordemAtendimento = ordemAtendimento;
        }

        public int ordemAtendimento() {
            return ordemAtendimento;
        }
    }

    public enum Status { ABERTO, EM_ATENDIMENTO, RESOLVIDO }

    public Chamado {
        if (id <= 0) {
            throw new IllegalArgumentException("O ID do chamado deve ser positivo.");
        }
        titulo = Validacoes.textoObrigatorio(titulo, "Título");
        equipe = Validacoes.textoObrigatorio(equipe, "Equipe");
        Objects.requireNonNull(prioridade, "Prioridade é obrigatória.");
        Objects.requireNonNull(status, "Status é obrigatório.");
    }

    public boolean aguardandoAtendimento() {
        return status == Status.ABERTO;
    }
}
