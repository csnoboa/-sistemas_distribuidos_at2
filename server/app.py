from flask import Flask, request, render_template
from flask_sse import sse
from flask_cors import CORS
import json
import time
from threading import Thread

from server import Server

# Checa se alguma enquete ja está expirada
def checar_enquetes_expiradas():
    while True:
        for enquete in server.enquetes:
            if (time.time() - enquete.segundos) > int(enquete.data_limite) and enquete.status != "Encerrada":
                with app.app_context():
                    server.notificar_usuarios_enquete_acabou(enquete)
        time.sleep(5)


app = Flask(__name__)
CORS(app)
server = Server()
app.config["REDIS_URL"] = "redis://localhost"
app.register_blueprint(sse, url_prefix='/stream')
app.app_context().push()

#Thread para checat a cada 5 segundos, se alguma enquete expirou
t = Thread(target=checar_enquetes_expiradas)
t.start()

@app.route("/ping")
def home():
    return "pong"

# Rota que cadastra um novo usuario
@app.route("/cadastrar", methods=["POST"])
def cadastrar():
    user_json = json.loads(request.data)
    server.cadastra_cliente(user_json["nome"])
    # sse.publish({"message": user_json["nome"] + " foi cadastrado"}, type='publish')
    return "Sucesso", 201

# Rota que cadastra uma nova enquete
@app.route("/cadastrar_enquete", methods=["POST"])
def cadastrar_enquete():
    enquete_json = json.loads(request.data)
    server.cria_enquete(enquete_json)
    return "Sucesso", 201

# Rota que um usuario faz quando quer ver suas listas
# O servidor responde via notificaçao
@app.route("/list_enquetes/<usuario>")
def listar_enquetes(usuario):
    enquetes_json = []
    for e in server.enquetes:
        for u in e.usuarios_votantes:
            if u == usuario:
                enquetes_json.append(e.to_json())
        if e.usuario_criador == usuario:
            enquetes_json.append(e.to_json())
    if len(enquetes_json) > 0:
        server.notifica_cliente("Lista de enquetes", usuario, enquetes_json)
    else:
        server.notifica_cliente("Nenhuma Enquete cadastrada para esse usuário", usuario, None)
    return " "

# Rota que o usuario utiliza para votar em uma enquete
@app.route("/votar", methods=["POST"])
def votar():
    voto = json.loads(request.data)
    server.receber_voto(voto['usuario'], voto['titulo'], voto['votos'])
    return "Votado com sucesso"


if __name__ == "__main__":
    app.run(host="localhost", port=5000)
