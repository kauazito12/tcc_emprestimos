const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "tccemprestimos@gmail.com",
    pass: "csig qtlz dhbq spig"
  }
});

async function enviarEmail(destinatario, professor, materiais) {
  try {
    await transporter.sendMail({
      from: '"Sistema de Empréstimos" <tccemprestimos@gmail.com>',
      to: destinatario,
      subject: "Lembrete de devolução de material escolar",

      html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:auto;border:1px solid #ddd;border-radius:8px;padding:20px">

          <h2 style="color:#1f4e79">
              Sistema de Empréstimos de Materiais
          </h2>

          <p>Olá, <strong>${professor}</strong>.</p>

          <p>
              Identificamos que os materiais abaixo permanecem
              emprestados há mais de <strong>24 horas</strong>.
          </p>

          <ul>
              ${materiais}
          </ul>

          <p>
              Solicitamos, por gentileza, que seja realizada a devolução
              dos materiais junto à secretaria da escola.
          </p>

          <p>
              Caso a devolução já tenha sido efetuada, desconsidere este e-mail.
          </p>

          <hr>

          <small>
              Sistema de Empréstimos de Materiais Escolares<br>
              Trabalho de Conclusão de Curso
          </small>

      </div>
      `
    });

    console.log("Email enviado para:", destinatario);

  } catch (erro) {

    console.error("Erro ao enviar email:", erro);

  }
}

module.exports = enviarEmail;