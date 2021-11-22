from __future__ import print_function
from enquete import Enquete
import time

from flask_sse import sse

class Server():
    def __init__(self):
        self.enquetes = []
        self.usuarios = []
        # #Thread para checat a cada 5 segundos, se alguma enquete expirou
        # t = Thread(target=self.checar_enquetes_expiradas)
        # t.start()

    def notifica_cliente(self, mensagem, user, data):
        sse.publish({"message": mensagem, "data": data}, type=user)

    # Cadastra o cliente como um Usuario
    def cadastra_cliente(self, name):
        for u in self.usuarios:
            self.notifica_cliente("usuario cadastrado: " + name, u, None)
        self.usuarios.append(name)
        print("Usuario {0} foi cadastrado com sucesso.".format(name))

    def cria_enquete(self, enquete_json):
        enquete = Enquete.criar_enquete_json(enquete_json)
        enquete.segundos = time.time()
        self.enquetes.append(enquete)

        for u in self.usuarios:
            if u != enquete.usuario_criador:
                self.notifica_cliente("Nova enquete criada: " + enquete.titulo, u, enquete_json)

        print("A enquete {0} foi cadastrada por {1}.".format(enquete.titulo, enquete.usuario_criador))


    # Recebe o voto de um cliente em uma enquete - checha o dia e hora
    def receber_voto(self, name, titulo, voto: list[int]):
        print("Voto recebido: " + name + " enquete: " + titulo + " votos: " + str(voto))

        for enquete in self.enquetes:
            if enquete.titulo == titulo:
                enquete.usuarios_votantes.append(name)
                for v in voto:
                    enquete.datas[v].votar()

                # Se todos os usuários tiverem votado a enquete acaba
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

        for u in enquete.usuarios_votantes:
            self.notifica_cliente("Enquete acabou: " + enquete.titulo, u, enquete.to_json())
        self.notifica_cliente("Enquete acabou: " + enquete.titulo, enquete.usuario_criador, enquete.to_json())

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
