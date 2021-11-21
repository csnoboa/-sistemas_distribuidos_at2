

window.onload = () => {
    console.log("window loaded");
    document.getElementById("signupdiv").style.display = "block";
    document.getElementById("contentdiv").style.display = "none";
    document.getElementById("votar_enquete").style.display = "none";
  };



  function cadastrar_enquete() {
    var titulo = document.getElementById("titulo").value;
    var nome = document.getElementById("loggedas").innerHTML;
    var local = document.getElementById("local").value;

    var dia_data_1 = document.getElementById("dia_data_1").value;
    var horario_data_1 = document.getElementById("horario_data_1").value;

    var dia_data_2 = document.getElementById("dia_data_2").value;
    var horario_data_2 = document.getElementById("horario_data_2").value;

    var dia_data_3 = document.getElementById("dia_data_3").value;
    var horario_data_3 = document.getElementById("horario_data_3").value;

    var data_limite = document.getElementById("data_limite").value;



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
    fetch("http://localhost:5000/cadastrar_enquete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data)
      })

      document.getElementById("titulo").value == "";
      document.getElementById("local").value = "";
      document.getElementById("dia_data_1").value = "";
      document.getElementById("horario_data_1").value = "";
      document.getElementById("dia_data_2").value = "";
      document.getElementById("horario_data_2").value = "";
      document.getElementById("dia_data_3").value = "";
      document.getElementById("horario_data_3").value = "";
      document.getElementById("data_limite").value = "";

  }

  function votar_enquete() {

    document.getElementById("votar_enquete").style.display = "none";

  }

  function cadastrar() {
    document.getElementById("signupdiv").style.display = "none";
    document.getElementById("contentdiv").style.display = "block";
    document.getElementById("loggedas").innerHTML = document.getElementById("nome").value;

    var nome = document.getElementById("nome").value;
    console.log("Usuario: " + nome)

    const data = { "nome": nome };

    fetch("http://localhost:5000/cadastrar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data)
    })

    var source = new EventSource("http://localhost:5000/stream");
    source.addEventListener('usuarios', function(event) {
        var data = JSON.parse(event.data);
        console.log("The server says " + data.message);
        document.getElementById("notificacoes").innerHTML += data.message + "<br>";
        if (data.message.includes("Nova enquete criada:"))
        {
          document.getElementById("votar_enquete_titulo").innerHTML += data.data.titulo + "  Local: " + data.data.local;

          datas = data.data.datas;
          console.log(datas)
          document.getElementById("votar_enquete").style.display = "block";
          document.getElementById("data1").innerHTML = "Data1:  Dia = " + datas[0].dia + "    Horario = " + datas[0].horario + " <br>";
          document.getElementById("data2").innerHTML = "Data2:  Dia = " + datas[1].dia + "    Horario = " + datas[1].horario + " <br>";
          document.getElementById("data3").innerHTML = "Data3:  Dia = " + datas[2].dia + "    Horario = " + datas[2].horario + " <br>";

        }
    }, false);
    source.addEventListener('error', function(event) {
        console.log("Error"+ event)
        alert("Failed to connect to event stream. Is Redis running?");
    }, false);

  }

  //execute with -> "python -m http.server 8080"
  //see logs on "localhost:8080/public"