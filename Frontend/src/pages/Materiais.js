import React, { useEffect, useState } from "react";

function Materiais() {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [materiais, setMateriais] = useState([]);
  const [editandoId, setEditandoId] = useState(null);

  const tiposMateriais = [
    "Lápis",
    "Caneta",
    "Borracha",
    "Cola",
    "Régua",
    "Caderno",
    "Tesoura",
    "Apontador",
    "Papel",
    "Giz",
    "Tinta",
  ];

  useEffect(() => {
    buscarMateriais();
  }, []);

  const buscarMateriais = async () => {
    try {
      const resposta = await fetch("http://localhost:3001/materiais");

      if (!resposta.ok) {
        throw new Error("Erro ao buscar materiais");
      }

      const dados = await resposta.json();
      setMateriais(dados);
    } catch (error) {
      console.error("Erro ao buscar materiais:", error);
      alert("Erro ao carregar materiais.");
    }
  };

  const salvarMaterial = async (e) => {
    e.preventDefault();

    if (!nome.trim() || !tipo || !quantidade) {
      alert("Preencha todos os campos.");
      return;
    }

    const material = {
      nome: nome.trim(),
      tipo: tipo,
      quantidade: Number(quantidade),
    };

    console.log("Enviando material:", material);

    try {
      let resposta;

      if (editandoId) {
        resposta = await fetch(`http://localhost:3001/materiais/${editandoId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(material),
        });
      } else {
        resposta = await fetch("http://localhost:3001/materiais", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(material),
        });
      }

      if (!resposta.ok) {
        const erroTexto = await resposta.text();
        console.error("Erro do backend:", erroTexto);
        alert("Erro ao salvar material. Veja o console.");
        return;
      }

      limparFormulario();
      await buscarMateriais();

      alert(editandoId ? "Material atualizado com sucesso!" : "Material cadastrado com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar material:", error);
      alert("Erro ao salvar material.");
    }
  };

  const editarMaterial = (material) => {
    setNome(material.nome);
    setTipo(material.tipo);
    setQuantidade(material.quantidade);
    setEditandoId(material.id);
  };

  const excluirMaterial = async (id) => {
    const confirmar = window.confirm("Deseja realmente excluir este material?");
    if (!confirmar) return;

    try {
      const resposta = await fetch(`http://localhost:3001/materiais/${id}`, {
        method: "DELETE",
      });

      if (!resposta.ok) {
        throw new Error("Erro ao excluir material");
      }

      await buscarMateriais();
      alert("Material excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir material:", error);
      alert("Erro ao excluir material.");
    }
  };

  const limparFormulario = () => {
    setNome("");
    setTipo("");
    setQuantidade("");
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
        Gerenciamento de Materiais
      </h1>

      <form
        onSubmit={salvarMaterial}
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
          placeholder="Nome do material"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          style={{
            padding: "8px",
            width: "180px",
          }}
        />

        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          style={{
            padding: "8px",
            width: "180px",
          }}
        >
          <option value="">Selecione o tipo</option>
          {tiposMateriais.map((item, index) => (
            <option key={index} value={item}>
              {item}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Quantidade"
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
          style={{
            padding: "8px",
            width: "150px",
          }}
        />

        <button
          type="submit"
          style={{
            padding: "8px 14px",
            cursor: "pointer",
          }}
        >
          {editandoId ? "Atualizar Material" : "Adicionar Item"}
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
            <th style={estiloTh}>Tipo</th>
            <th style={estiloTh}>Quantidade</th>
            <th style={estiloTh}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {materiais.length > 0 ? (
            materiais.map((material) => (
              <tr key={material.id}>
                <td style={estiloTd}>{material.id}</td>
                <td style={estiloTd}>{material.nome}</td>
                <td style={estiloTd}>{material.tipo}</td>
                <td style={estiloTd}>{material.quantidade}</td>
                <td style={estiloTd}>
                  <button
                    onClick={() => editarMaterial(material)}
                    style={{
                      marginRight: "8px",
                      padding: "6px 10px",
                      cursor: "pointer",
                    }}
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => excluirMaterial(material.id)}
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
              <td style={estiloTd} colSpan="5">
                Nenhum material cadastrado.
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

export default Materiais;