

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

  function signup() {
    document.getElementById("signupdiv").style.display = "none";
    document.getElementById("contentdiv").style.display = "block";
    document.getElementById("loggedas").innerHTML =
      document.getElementById("username").value;
    document.getElementById("loggedphone").innerHTML =
      document.getElementById("phone").value;

    var username = document.getElementById("username").value;
    var eventSource = new EventSource("http://localhost:5000/stream/" + username);

    eventSource.onerror = (event, err) => {
      console.error("Error in connect SSE", event, err);
    };

    eventSource.addEventListener("message", (e) => {
      console.log("received event", e);
      var targetContainer = document.getElementById("data");
      var data_filtered = e.data.replaceAll("---", "<br />");
      targetContainer.innerHTML = data_filtered;
    });
  }

  //execute with -> "python -m http.server 8080"
  //see logs on "localhost:8080/public"