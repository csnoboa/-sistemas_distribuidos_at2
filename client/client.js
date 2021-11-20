

window.onload = () => {
    console.log("window loaded");
    document.getElementById("rides_result").style.display = "none";
    document.getElementById("signupdiv").style.display = "block";
    document.getElementById("contentdiv").style.display = "none";
  };

  function toggleRides() {
    var x = document.getElementById("rides_result");
    if (x.style.display === "none") {
      get_rides();
      x.style.display = "block";
    } else {
      x.style.display = "none";
    }
  }

  function offer_or_want() {
    var is_offered = document.getElementById("offered").checked;
    var from = document.getElementById("from").value;
    var to = document.getElementById("to").value;
    var date = document.getElementById("date").value;
    var passengers = document.getElementById("passengers").value;
    var username = document.getElementById("username").value;

    ride = {
      location: [from, to],
      date: date,
      passengers: passengers,
      user: username,
      offered: is_offered,
    };

    fetch("http://localhost:5000/offer_or_want_ride", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ride),
    })
      .then((response) => {
        console.log(response);
      })
      .catch((err) => {
        console.error(err);
      });

    clear_all();
  }

  function clear_all() {
    document.getElementById("offered").checked == false;
    document.getElementById("from").value = "";
    document.getElementById("to").value = "";
    document.getElementById("date").value = "";
    document.getElementById("passengers").value = "";
    document.getElementById("cancel").value = "";
  }

  function get_rides() {
    fetch("http://localhost:5000/get_rides", {
      method: "GET",
      headers: {},
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (ride_list) {
        var targetContainer = document.getElementById("response");
        response_json =
          "<pre>" + JSON.stringify(ride_list, undefined, 2) + "</pre>";

        targetContainer.innerHTML = response_json;
      })
      .catch((err) => {
        console.error(err);
      });

    clear_all();
  }

  function cancel_ride() {
    var ride_id_to_cancel = document.getElementById("cancel").value;

    fetch("http://localhost:5000/cancel_ride", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: String(ride_id_to_cancel),
    })
      .then((response) => {
        console.log(response);
      })
      .catch((err) => {
        console.error(err);
      });

    clear_all();
  }

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
        document.getElementById("notificacoes").innerHTML += event.data + "<br>";
    }, false);
    source.addEventListener('error', function(event) {
        console.log("Error"+ event)
        alert("Failed to connect to event stream. Is Redis running?");
    }, false);

  }

  //execute with -> "python -m http.server 8080"
  //see logs on "localhost:8080/public"