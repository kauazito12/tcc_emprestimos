import React, { useEffect, useState } from "react";

function Usuarios() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [professores, setProfessores] = useState([]);
  const [editandoId, setEditandoId] = useState(null);

  useEffect(() => {
    buscarProfessores();
  }, []);

  const buscarProfessores = async () => {
    try {
      const resposta = await fetch("http://localhost:3001/professores");

      if (!resposta.ok) {
        throw new Error("Erro ao buscar professores");
      }

      const dados = await resposta.json();
      console.log("Professores recebidos:", dados);
      setProfessores(dados);
    } catch (error) {
      console.error("Erro ao buscar professores:", error);
      alert("Erro ao carregar professores.");
    }
  };

  const salvarProfessor = async (e) => {
    e.preventDefault();

    if (!nome.trim() || !email.trim()) {
      alert("Preencha nome e email.");
      return;
    }

    const professor = {
      nome: nome.trim(),
      email: email.trim(),
    };

    try {
      let resposta;

      if (editandoId) {
        resposta = await fetch(`http://localhost:3001/professores/${editandoId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(professor),
        });
      } else {
        resposta = await fetch("http://localhost:3001/professores", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(professor),
        });
      }

      if (!resposta.ok) {
        const erroTexto = await resposta.text();
        console.error("Erro do backend:", erroTexto);
        alert("Erro ao salvar professor.");
        return;
      }

      limparFormulario();
      await buscarProfessores();
    } catch (error) {
      console.error("Erro ao salvar professor:", error);
      alert("Erro ao salvar professor.");
    }
  };

  const editarProfessor = (professor) => {
    setNome(professor.nome);
    setEmail(professor.email);
    setEditandoId(professor.id);
  };

  const excluirProfessor = async (id) => {
    const confirmar = window.confirm("Deseja realmente excluir este professor?");
    if (!confirmar) return;

    try {
      const resposta = await fetch(`http://localhost:3001/professores/${id}`, {
        method: "DELETE",
      });

      if (!resposta.ok) {
        throw new Error("Erro ao excluir professor");
      }

      await buscarProfessores();
    } catch (error) {
      console.error("Erro ao excluir professor:", error);
      alert("Erro ao excluir professor.");
    }
  };

  const limparFormulario = () => {
    setNome("");
    setEmail("");
    setEditandoId(null);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#4b4f58",
        padding: "30px",
        color: "#000",
      }}
    >
      <h1 style={{ fontSize: "48px", marginBottom: "30px" }}>
        Gerenciamento de Professores
      </h1>

      <form
        onSubmit={salvarProfessor}
        style={{
          display: "flex",
          gap: "10px",
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: "30px",
        }}
      >
        <input
          type="text"
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          style={{
            padding: "8px",
            width: "220px",
          }}
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            padding: "8px",
            width: "220px",
          }}
        />

        <button
          type="submit"
          style={{
            padding: "8px 14px",
            cursor: "pointer",
          }}
        >
          {editandoId ? "Atualizar" : "Salvar"}
        </button>

        {editandoId && (
          <button
            type="button"
            onClick={limparFormulario}
            style={{
              padding: "8px 14px",
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
        )}
      </form>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          backgroundColor: "#fff",
        }}
      >
        <thead>
          <tr>
            <th style={estiloTh}>ID</th>
            <th style={estiloTh}>Nome</th>
            <th style={estiloTh}>Email</th>
            <th style={estiloTh}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {professores.length > 0 ? (
            professores.map((professor) => (
              <tr key={professor.id}>
                <td style={estiloTd}>{professor.id}</td>
                <td style={estiloTd}>{professor.nome}</td>
                <td style={estiloTd}>{professor.email}</td>
                <td style={estiloTd}>
                  <button
                    onClick={() => editarProfessor(professor)}
                    style={{
                      marginRight: "8px",
                      padding: "6px 10px",
                      cursor: "pointer",
                    }}
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => excluirProfessor(professor.id)}
                    style={{
                      padding: "6px 10px",
                      cursor: "pointer",
                    }}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td style={estiloTd} colSpan="4">
                Nenhum professor cadastrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const estiloTh = {
  border: "1px solid #ccc",
  padding: "12px",
  textAlign: "left",
  backgroundColor: "#e9e9e9",
};

const estiloTd = {
  border: "1px solid #ccc",
  padding: "12px",
};

export default Usuarios;