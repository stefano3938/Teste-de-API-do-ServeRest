/// <reference types="Cypress"/>

// Importa a biblioteca faker para gerar dados aleatórios
import { faker } from '@faker-js/faker';

describe('Testes de API - Funcionalidade Produtos', () => {

    let token;
    let produtoID;
    const nomeProduto = faker.commerce.productName();
    const precoProduto = faker.commerce.price();
    const descricaoProduto = faker.commerce.productDescription();
    const quantidadeProduto = faker.number.int(100);

    before(() => {
        // Realiza o login uma vez antes de todos os testes do bloco
        cy.request({
            method: 'POST',
            url: 'https://serverest.dev/login',
            body: {
                "email": "fulano@qa.com",
                "password": "teste"
            }
        }).then((response) => {
            expect(response.status).to.equal(200);
            expect(response.body.message).to.equal("Login realizado com sucesso");
            token = response.body.authorization; // Salva o token para ser usado nos testes
        });
    });

    it('Deve listar todos os produtos cadastrados - GET /produtos', () => {
        cy.request({
            method: 'GET',
            url: 'https://serverest.dev/produtos'
        }).then(response => {
            expect(response.status).to.equal(200);
            expect(response.body.produtos).to.be.an('array'); // Verifica se 'produtos' é uma lista
        });
    });

    it('Deve cadastrar um novo produto com sucesso - POST /produtos', () => {
        cy.request({
            method: 'POST',
            url: 'https://serverest.dev/produtos',
            headers: {
                authorization: token
            },
            body: {
                "nome": nomeProduto,
                "preco": precoProduto,
                "descricao": descricaoProduto,
                "quantidade": quantidadeProduto
            }
        }).then((response) => {
            expect(response.status).to.equal(201);
            expect(response.body.message).to.equal("Cadastro realizado com sucesso");
            expect(response.body).to.have.property('_id');
            produtoID = response.body._id; // Salva o ID do produto para os próximos testes
        });
    });

    it('Não deve cadastrar um produto com nome já existente - POST /produtos', () => {
        // Usa o mesmo nome de produto do teste anterior para forçar o erro
        cy.request({
            method: 'POST',
            url: 'https://serverest.dev/produtos',
            headers: {
                authorization: token
            },
            body: {
                "nome": nomeProduto,
                "preco": 300,
                "descricao": "Produto repetido",
                "quantidade": 100
            },
            failOnStatusCode: false // Impede o Cypress de falhar o teste por causa do status 400
        }).then(response => {
            expect(response.status).to.equal(400);
            expect(response.body.message).to.equal('Já existe produto com esse nome');
        });
    });

    it('Deve buscar um produto por ID com sucesso - GET /produtos/{_id}', () => {
        cy.request({
            method: 'GET',
            url: `https://serverest.dev/produtos/${produtoID}`
        }).then(response => {
            expect(response.status).to.equal(200);
            expect(response.body.nome).to.equal(nomeProduto); // Valida se o produto retornado é o correto
            expect(response.body._id).to.equal(produtoID);
        });
    });

    it('Deve retornar erro ao buscar um produto com ID inexistente - GET /produtos/{_id}', () => {
        cy.request({
            method: 'GET',
            url: 'https://serverest.dev/produtos/IDNaoExiste',
            failOnStatusCode: false
        }).then(response => {
            expect(response.status).to.equal(400);
            expect(response.body.message).to.equal('Produto não encontrado');
        });
    });

    it('Deve editar um produto com sucesso - PUT /produtos/{_id}', () => {
        const nomeEditado = faker.commerce.productName();
        cy.request({
            method: 'PUT',
            url: `https://serverest.dev/produtos/${produtoID}`,
            headers: {
                authorization: token
            },
            body: {
                "nome": nomeEditado,
                "preco": 150,
                "descricao": "Produto Editado",
                "quantidade": 50
            }
        }).then(response => {
            expect(response.status).to.equal(200);
            expect(response.body.message).to.equal('Registro alterado com sucesso');
        });
    });

    it('Deve excluir um produto com sucesso - DELETE /produtos/{_id}', () => {
        cy.request({
            method: 'DELETE',
            url: `https://serverest.dev/produtos/${produtoID}`,
            headers: {
                authorization: token
            }
        }).then(response => {
            expect(response.status).to.equal(200);
            expect(response.body.message).to.equal('Registro excluído com sucesso');
        });
    });

    it('Não deve excluir um produto previamente excluído ou inexistente - DELETE /produtos/{_id}', () => {
        cy.request({
            method: 'DELETE',
            url: `https://serverest.dev/produtos/${produtoID}`, // Tenta excluir o mesmo produto novamente
            headers: {
                authorization: token
            },
            failOnStatusCode: false
        }).then(response => {
            expect(response.status).to.equal(200); // A API retorna 200 mesmo sem excluir
            expect(response.body.message).to.equal('Nenhum produto excluído');
        });
    });
});