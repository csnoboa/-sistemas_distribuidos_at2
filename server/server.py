from __future__ import print_function
import Pyro5.api
from data import Data
from usuario import User
from enquete import Enquete
from threading import Thread
import time
from Crypto.Hash import SHA256
from Crypto.PublicKey import RSA
from Crypto.Signature import pss
import base64
import json
import logging
from apscheduler.schedulers.background import BackgroundScheduler
import datetime

from flask import Flask, request, render_template
from flask_sse import sse
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler


class Server():
    def __init__(self):
        self.enquetes = []
        self.usuarios = []
        #Thread para checat a cada 5 segundos, se alguma enquete expirou
        t = Thread(target=self.checar_enquetes_expiradas)
        t.start()

    # Pega o objeto do cliente (para utilizar seus metodos)
    def get_cliente_object(self, uri):
        return Pyro5.api.Proxy(uri)


    # Cadastra o cliente como um Usuario
    def cadastra_cliente(self, name, uri):
        usuario = User(name, uri)
        self.usuarios.append(usuario)
        print("Usuario {0} foi cadastrado com sucesso.".format(usuario.name))

    def cria_enquete(self, enquete_json):
        enquete = Enquete.criar_enquete_json(enquete_json)
        enquete.segundos = time.time()
        self.enquetes.append(enquete)
        print("A enquete {0} foi cadastrada por {1}.".format(enquete.titulo, enquete.usuario_criador))
        # try:
        #     threads = []
        #     for u in self.usuarios:
        #         t = Thread(target=self.notificar_usuarios_nova_enquete, args=(enquete, u))
        #         t.start()
        #         threads.append(t)

        #     # Espera todas as threads para começar
        #     for t in threads:
        #         t.join()
        # except:
        #     print ("Error: unable to start thread")

    # Notifica todos os usuarios cadastrados sobre nova enquete (menos o criador)
    def notificar_usuarios_nova_enquete(self, enquete, user):
        if user.name != enquete.usuario_criador:
            datas = self.get_cliente_object(user.uri).votar(enquete.to_json())
            if len(datas)>0:
                self.receber_voto(user.name, enquete.titulo, datas)

    # Recebe o voto de um cliente em uma enquete - checha o dia e hora
    def receber_voto(self, name, titulo, datas_json):
        print("Voto recebido: " + name + " enquete: " + titulo)
        datas = []
        for data in datas_json:
            datas.append(Data.criar_data_json(data))

        for enquete in self.enquetes:
            if enquete.titulo == titulo:
                enquete.usuarios_votantes.append(name)

                for data_total in enquete.datas:
                    for data in datas:
                        if data_total.dia == data.dia and data_total.horario == data.horario:
                            data_total.votar()

                # Se todos os usuários tiverem votado (menos o criador) a enquete acaba
                if len(enquete.usuarios_votantes) == (len(self.usuarios) - 1):
                    self.notificar_usuarios_enquete_acabou(enquete)

    # Notifica todos os usuários que a enquete acabou
    def notificar_usuarios_enquete_acabou(self, enquete):
        print("Enquete: " + enquete.titulo + " acabou, notificando usuarios...")
        maior = -1
        mais_votado = None

        for data in enquete.datas:
            if maior < data.votos:
                maior = data.votos
                mais_votado = data
        enquete.data_escolhida = mais_votado
        enquete.status = "Encerrada"


        for u in self.usuarios:
            for usuario_nome in enquete.usuarios_votantes:
                if u.name == usuario_nome:
                    self.get_cliente_object(u.uri).notificar_acabou(enquete.to_json())
            if u.name == enquete.usuario_criador:
                self.get_cliente_object(u.uri).notificar_acabou(enquete.to_json())

    # Mostra uma enquete para um usuario, mas primeiro confere a assinatura
    def ver_enquete(self, name, titulo, assinatura_digital, mensagem):
        user = None
        for u in self.usuarios:
            if u.name == name:
                user = u
        result = self.autentifica(user, assinatura_digital, mensagem)
        if result == 0:
            return "Não autentificado"

        for enquete in self.enquetes:
            if enquete.titulo == titulo:
                if enquete.usuario_criador == name:
                    return enquete.to_json()
                for u in enquete.usuarios_votantes:
                    if u == name:
                        return enquete.to_json()

        return "Nenhuma enquete encontrada"

    # Checa se alguma enquete ja está expirada
    def checar_enquetes_expiradas(self):
        while True:
            for enquete in self.enquetes:
                if (time.time() - enquete.segundos) > enquete.data_limite and enquete.status != "Encerrada":
                    self.notificar_usuarios_enquete_acabou(enquete)
            time.sleep(5)


app = Flask(__name__)
CORS(app)
server = Server()

@app.route("/ping")
def home():
    return "pong"

@app.route("/cadastrar", methods=["POST"])
def cadastrar():
    user_json = json.loads(request.data)
    server.cadastra_cliente(user_json["nome"], user_json["uri"])
    return "Sucesso", 201

@app.route("/list")
def listar_usuarios():
    usuarios_nomes = []
    for u in server.usuarios:
        usuarios_nomes.append(u.name)
    return json.dumps(usuarios_nomes)

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
