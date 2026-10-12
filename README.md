# Cardápio Digital — Sabor & Sorriso

Cardápio digital estático da hamburgueria **Sabor & Sorriso**, com seleção de produtos, carrinho e envio do pedido pelo WhatsApp. Os produtos usam apresentação padronizada, sem fotos individuais.

## Estrutura

```text
.
├── index.html       # Página principal
├── style.css        # Estilos e layout responsivo
├── script.js        # Produtos, carrinho e integração com WhatsApp
└── img/             # Apenas a identidade visual/logo
```

## Configuração do WhatsApp

Antes de publicar, abra `script.js` e substitua:

```js
const WHATSAPP_NUMBER = 'SEU_NUMERO_AQUI';
```

pelo número da loja, somente com DDD e números, sem espaços, parênteses ou hífen. O projeto já está configurado para o WhatsApp da Sabor & Sorriso.

```text
+55 (21) 99579-2519
```

## Como testar localmente

Como o projeto é estático, basta abrir `index.html` no navegador. Para evitar limitações do navegador com arquivos locais, também é possível usar qualquer servidor estático, por exemplo:

```bash
python3 -m http.server 8080
```

Depois acesse `http://localhost:8080`.

## Publicação

O projeto pode ser publicado em GitHub Pages, Netlify, Vercel ou outro serviço de hospedagem de arquivos estáticos.
