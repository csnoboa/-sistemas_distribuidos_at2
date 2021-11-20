# from flask import Flask, render_template
# from flask_sse import sse
# from flask_cors import CORS

# app = Flask(__name__)
# CORS(app)
# app.config["REDIS_URL"] = "redis://localhost"
# app.register_blueprint(sse, url_prefix='/stream')

# @app.route('/hello')
# def publish_hello():
#     sse.publish({"message": "Hello!"}, type='publish')
#     return "Message sent!"

from flask import Flask, request, render_template
from flask_sse import sse
from flask_cors import CORS
import json

from server import Server


app = Flask(__name__)
CORS(app)
server = Server()
app.config["REDIS_URL"] = "redis://localhost"
app.register_blueprint(sse, url_prefix='/stream')

@app.route("/ping")
def home():
    return "pong"

@app.route("/cadastrar", methods=["POST"])
def cadastrar():
    user_json = json.loads(request.data)
    server.cadastra_cliente(user_json["nome"])
    # sse.publish({"message": user_json["nome"] + " foi cadastrado"}, type='publish')
    return "Sucesso", 201

@app.route("/list")
def listar_usuarios():
    return json.dumps(server.usuarios)

@app.route("/cadastrar_enquete", methods=["POST"])
def cadastrar_enquete():
    enquete_json = json.loads(request.data)
    server.cria_enquete(enquete_json)
    return "Sucesso", 201

@app.route("/list_enquetes")
def listar_enquetes():
    enquetes_json = []
    for e in server.enquetes:
        enquetes_json.append(e.to_json())
    return json.dumps(enquetes_json)

if __name__ == "__main__":
    app.run(host="localhost", port=5000)
