const cron = require("node-cron");
const pool = require("./db");
const enviarEmail = require("./email");

cron.schedule("*/30 * * * *", async () => {
    console.log("Verificando empréstimos com mais de 24 horas...");

    try {

        const resultado = await pool.query(`
            SELECT
                p.id AS professor_id,
                p.nome,
                p.email,
                m.nome AS material,
                e.id AS emprestimo_id

            FROM emprestimos e

            INNER JOIN professores p
                ON p.id = e.professor_id

            INNER JOIN materiais m
                ON m.id = e.material_id

            WHERE
                e.devolvido = FALSE
                AND e.email_enviado = FALSE
                AND e.data_limite <= NOW()

            ORDER BY p.nome
        `);

        if (resultado.rows.length === 0) {
            console.log("Nenhum empréstimo vencido.");
            return;
        }

        const professores = {};

        resultado.rows.forEach(item => {

            if (!professores[item.professor_id]) {

                professores[item.professor_id] = {
                    nome: item.nome,
                    email: item.email,
                    materiais: [],
                    emprestimos: []
                };

            }

            professores[item.professor_id].materiais.push(
                `<li>${item.material}</li>`
            );

            professores[item.professor_id].emprestimos.push(
                item.emprestimo_id
            );

        });

        for (const professor of Object.values(professores)) {

            await enviarEmail(
                professor.email,
                professor.nome,
                professor.materiais.join("")
            );

            await pool.query(
                `
                UPDATE emprestimos
                SET email_enviado = TRUE
                WHERE id = ANY($1::int[])
                `,
                [professor.emprestimos]
            );

            console.log(
                `Email enviado para ${professor.nome}`
            );
        }

    } catch (erro) {

        console.error("Erro nas notificações:", erro);

    }

});