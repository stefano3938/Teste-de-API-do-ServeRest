import { faker } from '@faker-js/faker';

describe('Testes de API ServeRest - Produtos', () => {
    let token;
    let userId;
    let user;
    const baseUrl = 'https://serverest.dev';

    before(() => {
        user = {
            nome: `${faker.person.firstName()} ${faker.person.lastName()}`,
            email: faker.internet.email(),
            password: 'teste',
            administrador: 'true'
        };
        cy.request({
            method: 'POST',
            url: `${baseUrl}/usuarios`,
            body: user,
            failOnStatusCode: false
        }).then((createUserResp) => {
            expect([201, 400]).to.include(createUserResp.status);

            if (createUserResp.status === 201) {
                userId = createUserResp.body._id;
                cy.log(`Usuário criado: ${userId}`);
                cy.request({
                    method: 'POST',
                    url: `${baseUrl}/login`,
                    body: {
                        email: user.email,
                        password: user.password
                    }
                }).then((response) => {
                    expect(response.status).to.equal(200);
                    token = response.body.authorization;
                    expect(token).to.be.a('string');
                });
            } else {
                cy.request({
                    method: 'GET',
                    url: `${baseUrl}/usuarios`
                }).then((resp) => {
                    const found = resp.body.usuarios.find(u => u.email === user.email);
                    expect(found, 'usuario existente').to.exist;
                    userId = found._id;

                    cy.request({
                        method: 'POST',
                        url: `${baseUrl}/login`,
                        body: {
                            email: user.email,
                            password: user.password
                        }
                    }).then((response) => {
                        expect(response.status).to.equal(200);
                        token = response.body.authorization;
                        expect(token).to.be.a('string');
                    });
                });
            }
        });
    });

    it('Deve cadastrar um produto com sucesso', () => {
        const nomeProduto = faker.commerce.productName();

        cy.request({
            method: 'POST',
            url: `${baseUrl}/produtos`,
            headers: {
                Authorization: token
            },
            body: {
                nome: nomeProduto,
                preco: faker.number.int({ min: 10, max: 1000 }),
                descricao: faker.commerce.productDescription(),
                quantidade: faker.number.int({ min: 1, max: 500 })
            }
        }).then((response) => {
            expect(response.status).to.equal(201);
            expect(response.body.message).to.equal('Cadastro realizado com sucesso');
            expect(response.body).to.have.property('_id');
        });
    });

    it('Deve listar todos os produtos cadastrados', () => {
        cy.request({
            method: 'GET',
            url: `${baseUrl}/produtos`
        }).then((response) => {
            expect(response.status).to.equal(200);
            expect(response.body).to.have.property('produtos');
            expect(response.body.produtos).to.be.an('array');
        });
    });

    it('Deve buscar um produto por ID com sucesso', () => {
        const nomeProduto = faker.commerce.productName();

        cy.request({
            method: 'POST',
            url: `${baseUrl}/produtos`,
            headers: { Authorization: token },
            body: {
                nome: nomeProduto,
                preco: faker.number.int({ min: 10, max: 1000 }),
                descricao: 'Produto para teste de busca por ID',
                quantidade: faker.number.int({ min: 1, max: 100 })
            }
        }).then((createResponse) => {
            const productId = createResponse.body._id;

            cy.request({
                method: 'GET',
                url: `${baseUrl}/produtos/${productId}`
            }).then((getResponse) => {
                expect(getResponse.status).to.equal(200);
                expect(getResponse.body._id).to.equal(productId);
                expect(getResponse.body.nome).to.equal(nomeProduto);
            });
        });
    });

    it('Deve editar usuário com sucesso', () => {
        const novoNome = `${faker.person.firstName()} ${faker.person.lastName()}`;

        cy.request({
            method: 'PUT',
            url: `${baseUrl}/usuarios/${userId}`,
            headers: { Authorization: token },
            body: {
                nome: novoNome,
                email: user.email,
                password: user.password,
                administrador: 'true'
            }
        }).then((response) => {
            expect(response.status).to.equal(200);
            expect(response.body.message).to.equal('Registro alterado com sucesso');
        });
    });

    it('Deve excluir usuário com sucesso', () => {
        cy.request({
            method: 'DELETE',
            url: `${baseUrl}/usuarios/${userId}`,
            headers: { Authorization: token }
        }).then((response) => {
            expect(response.status).to.equal(200);
            expect(response.body.message).to.equal('Registro excluído com sucesso');
        });
    });
});