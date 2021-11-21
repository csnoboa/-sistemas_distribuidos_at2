from __future__ import print_function
from data import Data
from usuario import User
from enquete import Enquete
from threading import Thread
import time

from flask_sse import sse

class Server():
    def __init__(self):
        self.enquetes = []
        self.usuarios = []
        #Thread para checat a cada 5 segundos, se alguma enquete expirou
        t = Thread(target=self.checar_enquetes_expiradas)
        t.start()

    def notifica_clientes(self, mensagem, canal, data):
        sse.publish({"message": mensagem, "data": data}, type=canal)
        pass

    # Cadastra o cliente como um Usuario
    def cadastra_cliente(self, name):
        self.usuarios.append(name)
        self.notifica_clientes("usuario cadastrado: " + name, "usuarios", None)
        print("Usuario {0} foi cadastrado com sucesso.".format(name))

    def cria_enquete(self, enquete_json):
        enquete = Enquete.criar_enquete_json(enquete_json)
        enquete.segundos = time.time()
        self.enquetes.append(enquete)

        self.notifica_clientes("Nova enquete criada: " + enquete.titulo, "usuarios", enquete_json)

        print("A enquete {0} foi cadastrada por {1}.".format(enquete.titulo, enquete.usuario_criador))


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


        self.notifica_clientes("Enquete acabou: " + enquete.titulo, enquete.titulo, enquete.to_json())

    # Mostra uma enquete para um usuario, mas primeiro confere a assinatura
    def ver_enquete(self, name, titulo):

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
                if (time.time() - enquete.segundos) > int(enquete.data_limite) and enquete.status != "Encerrada":
                    self.notificar_usuarios_enquete_acabou(enquete)
            time.sleep(5)
