
var titulo_global = ''
var usuario_global = ''

// Esconte os divs que não devem aparecer no inicio
window.onload = () => {
    console.log("window loaded");
    document.getElementById("signupdiv").style.display = "block";
    document.getElementById("contentdiv").style.display = "none";
    document.getElementById("votar_enquete").style.display = "none";
  };


  // Cadastra o usuario no servidor
  function cadastrar() {
    document.getElementById("signupdiv").style.display = "none";
    document.getElementById("contentdiv").style.display = "block";
    usuario_global = document.getElementById("usuario_cadastrado").innerHTML = document.getElementById("nome").value;

    var nome = document.getElementById("nome").value;
    console.log("Usuario: " + nome)

    const data = { "nome": nome };

    //cadastra usuario no servidor
    fetch("http://localhost:5000/cadastrar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data)
    })

    // Escuta o servidor, no canal com o nome do usuario
    var source = new EventSource("http://localhost:5000/stream");
    source.addEventListener(nome, function(event) {
        var data = JSON.parse(event.data);

        // Imprime no log e na parte de notificacoes, qualquer recebimento do server
        console.log("The server says " + data.message);
        document.getElementById("notificacoes").innerHTML += data.message + "<br>";

        // Caso quando alguem criou uma nova enquete
        if (data.message.includes("Nova enquete criada:"))
        {
          titulo_global = data.data.titulo
          document.getElementById("votar_enquete_titulo").innerHTML = "Votar em uma nova enquete: " + data.data.titulo + "  Local: " + data.data.local;

          datas = data.data.datas;
          console.log(datas)
          document.getElementById("votar_enquete").style.display = "block";
          document.getElementById("data1").innerHTML = "Data1:  Dia = " + datas[0].dia + "    Horario = " + datas[0].horario + " <br>";
          document.getElementById("data2").innerHTML = "Data2:  Dia = " + datas[1].dia + "    Horario = " + datas[1].horario + " <br>";
          document.getElementById("data3").innerHTML = "Data3:  Dia = " + datas[2].dia + "    Horario = " + datas[2].horario + " <br>";

        }

        //Caso quando alguma enquete acabou
        if (data.message.includes("Enquete acabou:")){
          document.getElementById("enquete_encerrada").style.display = "block";

          document.getElementById("enquete_encerrada_header").innerHTML = "Enquete " + data.data.titulo + " encerrada! ";
          document.getElementById("local_encerrado").innerHTML = "Local: " + data.data.local
          document.getElementById("data_encerrado").innerHTML = "Data escolhida: Dia = " + data.data.data_escolhida.dia + " Horario = " + data.data.data_escolhida.horario
        }

        // Caso Resposta Da funçao listar_enquetes:
        // Mostra todas as enquetes que o usuario participa
        if (data.message.includes("Lista de enquetes")){
          enquetes = data.data;
          document.getElementById("enquetes_listadas").innerHTML = "";
          for(let i = 0; i < enquetes.length; i++){
            document.getElementById("enquetes_listadas").innerHTML += "Enquete: " + enquetes[i].titulo + "   Local : " + enquetes[i].local + "   Status: " + enquetes[i].status + "<br>";
          }
        }
        // Caso Resposta Da funçao listar_enquetes:
        // Se nenhuma enquete foi cadastrada
        if (data.message.includes("Nenhuma Enquete cadastrada para esse usuário")){
          document.getElementById("enquetes_listadas").innerHTML = "Nenhuma Enquete cadastrada para esse usuário";
        }
    }, false);
    source.addEventListener('error', function(event) {
        console.log("Error"+ event)
        alert("Failed to connect to event stream. Is Redis running?");
    }, false);

  }

  // Função chamada pelo botão, que envia para o servidor as informações
  // colocadas no HTML
  function cadastrar_enquete() {
    // Pega todas as informações do HTML
    var titulo = document.getElementById("titulo").value;
    var nome = document.getElementById("usuario_cadastrado").innerHTML;
    var local = document.getElementById("local").value;

    var dia_data_1 = document.getElementById("dia_data_1").value;
    var horario_data_1 = document.getElementById("horario_data_1").value;

    var dia_data_2 = document.getElementById("dia_data_2").value;
    var horario_data_2 = document.getElementById("horario_data_2").value;

    var dia_data_3 = document.getElementById("dia_data_3").value;
    var horario_data_3 = document.getElementById("horario_data_3").value;

    var data_limite = document.getElementById("data_limite").value;

    // cria o JSON que sera enviado ao servidor
    const data = {
      "titulo": titulo,
      "usuario_criador": nome,
      "local": local,
      "datas": [
        {
          "dia": dia_data_1,
          "horario": horario_data_1,
          "votos": 0
        },
        {
          "dia": dia_data_2,
          "horario": horario_data_2,
          "votos": 0
        },
        {
          "dia": dia_data_3,
          "horario": horario_data_3,
          "votos": 0
        },
      ],
      "data_limite": data_limite,
      "data_escolhida": null,
      "status": null
    }
    // envia a requisição para criar a enquete
    fetch("http://localhost:5000/cadastrar_enquete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data)
      })

      // Zera todas as entradas de texto
      document.getElementById("titulo").value = "";
      document.getElementById("local").value = "";
      document.getElementById("dia_data_1").value = "";
      document.getElementById("horario_data_1").value = "";
      document.getElementById("dia_data_2").value = "";
      document.getElementById("horario_data_2").value = "";
      document.getElementById("dia_data_3").value = "";
      document.getElementById("horario_data_3").value = "";
      document.getElementById("data_limite").value = "";

  }

  // Função que ve quais checkbox estão marcados, e envia as respostas para o servidor
  function votar_enquete() {

    document.getElementById("votar_enquete").style.display = "none";

    votos = []

    var data1_check = document.getElementById("data1_check");
    var data2_check = document.getElementById("data2_check");
    var data3_check = document.getElementById("data3_check");

    if (data1_check.checked) {
        votos.push(0)
    }
    if (data2_check.checked) {
      votos.push(1)
    }
    if (data3_check.checked) {
      votos.push(2)
    }

    console.log(votos)
    console.log("Foi votado")

    const data = {
      "usuario": usuario_global,
      "titulo": titulo_global,
      "votos": votos
    };

    fetch("http://localhost:5000/votar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data)
    })

  }

  // Função que envia pedido para o servidor enviar todas
  // as enquetes que estão cadastradas..
  // o servidor responde via sse
  function listar_enquetes() {
    fetch("http://localhost:5000/list_enquetes/" + usuario_global, {
      method: "GET",
    });
  }
